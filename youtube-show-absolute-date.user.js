// ==UserScript==
// @name         YouTube Show Absolute Date
// @namespace    https://github.com/PacificCosmophile
// @description  Replaces relative upload dates ("2 years ago") with absolute dates across YouTube.
// @version      1.2
// @author       PacificCosmophile+Vibecoded
// @license      MIT
// @match        https://www.youtube.com/*
// @homepageURL  https://github.com/PacificCosmophile/youtube-show-absolute-date
// @supportURL   https://github.com/PacificCosmophile/youtube-show-absolute-date/issues
// @icon         https://raw.githubusercontent.com/PacificCosmophile/YouTube-Show-Absolute-Date/main/icon.png
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    /*
     * YouTube Show Absolute Date
     * Replaces YouTube's relative upload dates
     * with locale-aware absolute dates.
     */

    // ====== USER SETTINGS ======
    // Set to true for 12-hour time (3:06 PM), false for 24-hour time (15:06)
    var USE_12_HOUR = true;
    // ============================

    var cache = {}; // videoId -> raw upload date
    var inflight = {}; // videoId -> Promise
    var scanTimeout = null;
    var lastUrl = location.href;

    var fullFormatter = null;
    var cardFormatter = null;

    var authCache = null;
    var authCacheTime = 0;

    // ---------- Date formatting ----------
    function getLocales() {
        var langs =
            Array.isArray(navigator.languages) && navigator.languages.length ?
            Array.from(navigator.languages) : [navigator.language || "en-US"];
        try {
            if (typeof window.ytcfg !== "undefined" && typeof window.ytcfg.get === "function") {
                var hl = window.ytcfg.get("HL");
                if (hl) return [hl].concat(langs);
            }
        } catch (_) {}
        return langs;
    }

    function getCardFormatter() {
        if (!cardFormatter) {
            cardFormatter = new Intl.DateTimeFormat(getLocales(), {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        }
        return cardFormatter;
    }

    function getFullFormatter() {
        if (!fullFormatter) {
            fullFormatter = new Intl.DateTimeFormat(getLocales(), {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: USE_12_HOUR
            });
        }
        return fullFormatter;
    }

    function formatCardDate(dateLike) {
        var d = new Date(dateLike);
        if (isNaN(d.getTime())) return null;

        return getCardFormatter().format(d);
    }

    function formatFullDate(dateLike) {
        var d = new Date(dateLike);
        if (isNaN(d.getTime())) return null;

        var locales = getLocales();

        var formatted = getFullFormatter().format(d);

        return formatted
            .replace(/\bAM\b/, "am")
            .replace(/\bPM\b/, "pm");
    }

    // ---------- videoId helpers ----------
    function getVideoIdFromHref(href) {
        if (!href) return null;
        try {
            if (href.indexOf("v=") !== -1) return new URL(href, location.origin).searchParams.get("v");
            if (href.indexOf("/shorts/") !== -1) {
                var m = href.match(/shorts\/([a-zA-Z0-9_-]+)/);
                return m ? m[1] : null;
            }
        } catch (_) {}
        return null;
    }

    function getSafeVideoId(container, selector) {
        selector = selector || "a#thumbnail";
        try {
            var anchor = container.querySelector(selector) || container.querySelector("a[href]");
            if (!anchor || !anchor.href) return null;
            return getVideoIdFromHref(anchor.href);
        } catch (_) {}
        return null;
    }

    function getCurrentShortsIdFromUrl() {
        var m = location.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
        return m ? m[1] : null;
    }

    function getShortsVideoIdFromOverlay(overlayRoot) {
        var fromUrl = getCurrentShortsIdFromUrl();
        if (fromUrl) return fromUrl;
        var a =
            overlayRoot.querySelector("yt-reel-multi-format-link-view-model a[href*='watch?v=']") ||
            overlayRoot.querySelector("a[href*='watch?v=']");
        return a ? getVideoIdFromHref(a.getAttribute("href")) : null;
    }

    // ---------- SAPISIDHASH auth for YouTube API ----------
    async function generateSAPISIDHASH() {
        // Reuse the generated auth header for 30 seconds.
        if (authCache && Date.now() - authCacheTime < 30000) {
            return authCache;
        }
        var sapisid = null;
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var parts = cookies[i].trim().split("=");
            var name = parts[0];
            if (name === "SAPISID" || name === "__Secure-3PAPISID") {
                sapisid = parts.slice(1).join("=");
                break;
            }
        }
        if (!sapisid) return null;

        var origin = "https://www.youtube.com";
        var timestamp = Math.floor(Date.now() / 1000);
        var input = timestamp + " " + sapisid + " " + origin;

        try {
            var hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
            var hashArray = Array.from(new Uint8Array(hashBuffer));
            var hash = hashArray.map(function(b) {
                return b.toString(16).padStart(2, "0");
            }).join("");
            authCache = "SAPISIDHASH " + timestamp + "_" + hash;
            authCacheTime = Date.now();

            return authCache;
        } catch (_) {
            return null;
        }
    }

    // ---------- fetch date (authenticated, with cache + inflight dedupe) ----------
    async function fetchDate(videoId) {
        if (!videoId) return null;
        if (cache[videoId]) return cache[videoId];
        if (inflight[videoId]) return inflight[videoId];

        var p = (async function() {
            try {
                // Get config from page
                var apiKey = null;
                var clientVersion = "2.20260213.01.00";
                try {
                    if (typeof window.ytcfg !== "undefined" && typeof window.ytcfg.get === "function") {
                        apiKey = window.ytcfg.get("INNERTUBE_API_KEY");
                        var cv = window.ytcfg.get("INNERTUBE_CLIENT_VERSION");
                        if (cv) clientVersion = cv;
                    }
                } catch (_) {}

                // Build auth header
                var authHeader = await generateSAPISIDHASH();

                // Build request headers
                var headers = {
                    "content-type": "application/json"
                };
                if (authHeader) {
                    headers["authorization"] = authHeader;
                    headers["x-goog-authuser"] = "0";
                    headers["x-origin"] = "https://www.youtube.com";
                }

                // Build URL with API key
                var url = "https://www.youtube.com/youtubei/v1/player";
                if (apiKey) url += "?key=" + apiKey;

                var response = await fetch(url, {
                    method: "POST",
                    headers: headers,
                    credentials: "include",
                    body: JSON.stringify({
                        context: {
                            client: {
                                clientName: "WEB",
                                clientVersion: clientVersion
                            }
                        },
                        videoId: videoId,
                    }),
                });

                if (!response.ok) return null;

                var data = await response.json();
                var micro = data.microformat && data.microformat.playerMicroformatRenderer;
                if (!micro) return null;

                var date =
                    (micro.liveBroadcastDetails && micro.liveBroadcastDetails.startTimestamp) ||
                    micro.publishDate ||
                    micro.uploadDate;

                var formatted = date;
                if (formatted) cache[videoId] = formatted;
                return formatted;
            } catch (_) {
                return null;
            } finally {
                delete inflight[videoId];
            }
        })();

        inflight[videoId] = p;
        return p;
    }

    // ---------- Replace YouTube's relative dates ----------
    async function overwriteUI(target, videoId) {
        if (!target || !videoId) return;
        if (target.dataset.ytudProcessing === "true") return;

        target.dataset.ytudProcessing = "true";

        try {
            var rawDate = await fetchDate(videoId);
            if (!rawDate) return;
            if (!document.body.contains(target)) return;

            // Only recommendations beside the watch page use the compact date.
            // Everything else uses the full date + time.
            var isRightSidebar =
                location.pathname === "/watch" &&
                (
                    target.closest("ytd-watch-next-secondary-results-renderer") ||
                    target.closest("#secondary") ||
                    target.closest("ytd-compact-video-renderer")
                );

            var dateText = isRightSidebar ?
                formatCardDate(rawDate) :
                formatFullDate(rawDate);

            // Detect the new YouTube lockup cards
            var metadataVM = target.closest("yt-content-metadata-view-model");

            if (metadataVM) {

                var rows = metadataVM.querySelectorAll(".ytContentMetadataViewModelMetadataRow");

                // Cards with three rows are Auto-dubbed cards
                if (rows.length >= 3) {

                    // Second row = Views • Date
                    var spans = rows[1].querySelectorAll(".ytContentMetadataViewModelMetadataText");

                    if (spans.length >= 2) {
                        spans[1].textContent = dateText;
                        return;
                    }
                }
            }

            // Everything else
            target.textContent = dateText;

        } finally {
            target.removeAttribute("data-ytud-processing");
        }
    }

    // ---------- Shorts player: date label under title ----------
    async function upsertShortsDate(overlayRoot) {
        var vId = getShortsVideoIdFromOverlay(overlayRoot);
        if (!vId) return;
        var titleVM = overlayRoot.querySelector("yt-shorts-video-title-view-model");
        if (!titleVM) return;
        var titleH2 = titleVM.querySelector("h2");
        if (!titleH2) return;

        var label = titleVM.querySelector(".ytud-shorts-date");
        if (!label) {
            label = document.createElement("div");
            label.className = "ytud-shorts-date";
            label.style.cssText = "margin-top:4px;font:inherit;font-size:14px;color:inherit;opacity:0.9;white-space:nowrap;";
            titleH2.insertAdjacentElement("afterend", label);
        }
        if (label.dataset.ytudVid === vId && label.textContent && label.textContent.indexOf("\u2026") === -1) return;
        label.dataset.ytudVid = vId;
        if (!label.textContent) label.textContent = "\u2026";

        var dateStr = await fetchDate(vId);
        if (!dateStr || !document.body.contains(label) || label.dataset.ytudVid !== vId) return;
        label.textContent = formatFullDate(dateStr);
    }

    // ---------- Shorts grid: INSERT new date below view count ----------
    async function upsertShortsGridDate(lockupEl) {
        if (!lockupEl) return;

        var shortsLink = lockupEl.querySelector("a[href*='/shorts/']");
        if (!shortsLink) return;
        var vId = getVideoIdFromHref(shortsLink.getAttribute("href"));
        if (!vId) return;

        // Find the subhead that shows view count
        var subhead = lockupEl.querySelector(".shortsLockupViewModelHostOutsideMetadataSubhead");
        if (!subhead || !subhead.parentElement) return;

        var metaContainer = subhead.parentElement;

        // Check if we already added a date label
        var label = metaContainer.querySelector(".ytud-shorts-grid-date");
        if (label && label.dataset.ytudVid === vId && label.textContent && label.textContent.indexOf("\u2026") === -1) {
            return; // already done
        }

        if (!label) {
            label = document.createElement("div");
            label.className = "ytud-shorts-grid-date";
            label.style.cssText =
                "font-size:1.2rem;line-height:1.8rem;font-weight:400;" +
                "color:var(--yt-spec-text-secondary,#aaa);" +
                "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
            subhead.insertAdjacentElement("afterend", label);
        }

        label.dataset.ytudVid = vId;
        if (!label.textContent) label.textContent = "\u2026";

        var dateStr = await fetchDate(vId);
        if (!dateStr || !document.body.contains(label) || label.dataset.ytudVid !== vId) return;
        label.textContent = formatFullDate(dateStr);
    }

    // ---------- Find the publish date span on the watch page ----------
    function findWatchPageDateSpan(container) {
        if (!container) return null;

        var spans = container.querySelectorAll("span");

        for (var i = 0; i < spans.length; i++) {
            var text = spans[i].textContent.trim();

            // Skip empty spans
            if (!text) continue;

            // Skip hashtags
            if (text.startsWith("#")) continue;

            // Skip views
            if (/view/i.test(text)) continue;

            // Relative dates
            if (
                /\bago\b/i.test(text) ||
                /\bminute/i.test(text) ||
                /\bhour/i.test(text) ||
                /\bday/i.test(text) ||
                /\bweek/i.test(text) ||
                /\bmonth/i.test(text) ||
                /\byear/i.test(text)
            ) {
                return spans[i];
            }

            // Already absolute date
            if (
                /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(text)
            ) {
                return spans[i];
            }
        }

        return null;
    }

    // ---------- scan ----------
    function runSmartScan() {
        // [A] Watch page main date
        var mainContainer = document.querySelector("#info.ytd-watch-info-text");
        if (mainContainer) {
            var dateTarget = findWatchPageDateSpan(mainContainer);
            var vId = new URLSearchParams(window.location.search).get("v");
            if (dateTarget && vId) overwriteUI(dateTarget, vId, true);
        }

        // [B] Playlist
        document.querySelectorAll("ytd-playlist-video-renderer").forEach(function(e) {
            var vId = getSafeVideoId(e);
            if (!vId) return;
            var metaContainer = e.querySelector("#video-info") || e.querySelector("#metadata-line");
            if (!metaContainer) return;
            var spans = metaContainer.querySelectorAll("span");
            var target = spans.length > 0 ? spans[spans.length - 1] : null;
            if (target) overwriteUI(target, vId);
        });

        // [C] Cards (home/search/recommend)
        var cardSelectors =
            "ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer, yt-lockup-view-model";
        document.querySelectorAll(cardSelectors).forEach(function(container) {
            var metaLine =
                container.querySelector("#metadata-line") ||
                container.querySelector("yt-content-metadata-view-model");
            if (!metaLine) return;
            var spans = metaLine.querySelectorAll("span");
            if (!spans.length) return;
            var target = spans.length >= 2 ? spans[1] : spans[0];
            if (container.tagName.toLowerCase() === "yt-lockup-view-model") {
                target = spans[spans.length - 1];
            }
            var vId = getSafeVideoId(container);
            if (!target || !vId) return;

            // Check if this target contains a "View full playlist" link
            var playlistLink = target.querySelector("a[href*='/playlist?list=']");
            if (playlistLink) {
                // This is a playlist card — don't overwrite the link span.
                // Instead, insert a date row BEFORE the link row and leave the link intact.
                var linkRow = target.closest(".yt-content-metadata-view-model__metadata-row") ||
                    target.closest(".ytContentMetadataViewModelMetadataRow");
                if (!linkRow) {
                    overwriteUI(target, vId);
                    return;
                }

                // Check if we already added a date row
                if (linkRow.previousElementSibling &&
                    linkRow.previousElementSibling.classList.contains("ytud-playlist-date-row")) return;

                // Match the row's actual class for consistent styling
                var rowClass = linkRow.className.indexOf("ytContentMetadataViewModelMetadataRow") !== -1 ?
                    "ytContentMetadataViewModelMetadataRow" : "yt-content-metadata-view-model__metadata-row";
                var textClass = linkRow.querySelector(".ytContentMetadataViewModelMetadataText") ?
                    "yt-core-attributed-string ytContentMetadataViewModelMetadataText yt-core-attributed-string--white-space-pre-wrap yt-core-attributed-string--link-inherit-color" :
                    "yt-core-attributed-string yt-content-metadata-view-model__metadata-text yt-core-attributed-string--white-space-pre-wrap yt-core-attributed-string--link-inherit-color";

                // Create a new metadata row for the date
                var dateRow = document.createElement("div");
                dateRow.className = rowClass + " ytud-playlist-date-row";
                var dateSpan = document.createElement("span");
                dateSpan.className = textClass;
                dateSpan.setAttribute("dir", "auto");
                dateSpan.setAttribute("role", "text");
                dateSpan.textContent = "\u2026";
                dateRow.appendChild(dateSpan);
                linkRow.parentElement.insertBefore(dateRow, linkRow);

                overwriteUI(dateSpan, vId);
            } else {
                overwriteUI(target, vId);
            }
        });

        // [D] Shorts player overlay (when watching a Short)
        document.querySelectorAll(".metadata-container.ytd-reel-player-overlay-renderer").forEach(function(overlay) {
            upsertShortsDate(overlay);
        });

        // [E] Shorts grid on channel pages (new date insertion)
        document.querySelectorAll("ytm-shorts-lockup-view-model").forEach(function(lockup) {
            // Skip if inside a v2 wrapper — process from innermost
            upsertShortsGridDate(lockup);
        });

        // [F] ytd-reel-item-renderer (older Shorts shelf layout)
        document.querySelectorAll("ytd-reel-item-renderer").forEach(function(item) {
            var shortsLink = item.querySelector("a[href*='/shorts/']");
            if (!shortsLink) return;
            var vId = getVideoIdFromHref(shortsLink.getAttribute("href"));
            if (!vId) return;
            var overlayText = item.querySelector("#overlay-text");
            if (!overlayText) return;
            var label = item.querySelector(".ytud-shorts-grid-date");
            if (label && label.dataset.ytudVid === vId && label.textContent && label.textContent.indexOf("\u2026") === -1) return;
            if (!label) {
                label = document.createElement("div");
                label.className = "ytud-shorts-grid-date";
                label.style.cssText = "font-size:1.2rem;line-height:1.8rem;font-weight:400;color:var(--yt-spec-text-secondary,#aaa);";
                overlayText.appendChild(label);
            }
            label.dataset.ytudVid = vId;
            if (!label.textContent) label.textContent = "\u2026";
            fetchDate(vId).then(function(dateStr) {
                if (!dateStr || !document.body.contains(label) || label.dataset.ytudVid !== vId) return;
                label.textContent = formatFullDate(dateStr);
            });
        });
    }

    // ---------- throttled observer (avoids infinite loop) ----------
    function startObserver() {
        var target = document.body || document.documentElement;
        if (!target) {
            setTimeout(startObserver, 50);
            return;
        }

        var observer = new MutationObserver(function(mutations) {
            // Skip mutations caused by our own label insertions
            var dominated = true;
            for (var i = 0; i < mutations.length; i++) {
                for (var j = 0; j < mutations[i].addedNodes.length; j++) {
                    var node = mutations[i].addedNodes[j];
                    if (node.nodeType === 1 && node.className && typeof node.className === "string" &&
                        (node.className.indexOf("ytud-") !== -1)) {
                        continue;
                    }
                    dominated = false;
                    break;
                }
                if (!dominated) break;
                if (mutations[i].removedNodes.length > 0) {
                    dominated = false;
                    break;
                }
            }
            if (dominated && mutations.length > 0) return;

            if (scanTimeout) clearTimeout(scanTimeout);
            scanTimeout = setTimeout(runSmartScan, 200);
        });
        observer.observe(target, {
            childList: true,
            subtree: true
        });

        // Multiple startup scans because YouTube loads content progressively.
        setTimeout(runSmartScan, 300);
        setTimeout(runSmartScan, 1500);
        setTimeout(runSmartScan, 4000);

        lastUrl = location.href;

        new MutationObserver(function() {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                scheduleScan(500);
            }
        }).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function scheduleScan(delay) {
        if (scanTimeout) clearTimeout(scanTimeout);
        scanTimeout = setTimeout(runSmartScan, delay || 0);
    }

    // ---------- navigation listeners ----------
    window.addEventListener("yt-navigate-finish", function() {
        scheduleScan(500);
    });

    window.addEventListener("yt-page-data-updated", function() {
        scheduleScan(500);
    });

    window.addEventListener("popstate", function() {
        scheduleScan(500);
    });


    // ---------- start ----------
    if (document.body) {
        startObserver();
    } else {
        document.addEventListener("DOMContentLoaded", startObserver);
        setTimeout(startObserver, 100);
    }

})();
