<h1 align="center">YouTube Show Absolute Date</h1>

<p align="center">
  Replace YouTube's vague relative upload dates (<b>"2 years ago"</b>) with precise, locale-aware <b>absolute dates</b> across the entire platform.
</p>

<p align="center">
  <a href="https://greasyfork.org/en/scripts/588066">
    <img src="https://img.shields.io/badge/Install%20Script-GreasyFork-red?style=for-the-badge&logo=greasyfork" alt="Install from GreasyFork">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/platform-YouTube-red?logo=youtube" alt="Platform">
  <img src="https://img.shields.io/badge/userscript-Violentmonkey%20%7C%20Greasemonkey%20%7C%20Tampermonkey-blue" alt="Userscript Engine">
  <img src="https://img.shields.io/badge/version-1.0-orange" alt="Version">
</p>

---

<details>
  <summary><b>Table of Contents</b> (click to expand)</summary>

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [📍 Supported Locations](#-supported-locations)
- [💡 Example](#-example)
- [🚀 Quick Installation](#-quick-installation)
- [⚙️ Configuration](#configuration)
- [🛠️ How It Works](#how-it-works)
- [🌐 Compatibility](#compatibility)
- [🔒 Privacy](#privacy)
- [🙏 Acknowledgements](#acknowledgements)
- [🤝 Contributing](#contributing)
- [📜 License](#license)
</details>

---

## ✨ Features

- 📅 **Absolute Timestamps:** Replaces relative dates like "3 months ago" with exact dates and times.
- 🌍 **Locale-Aware:** Automatically formats dates according to your browser's language and regional settings.
- 🕒 **12-Hour / 24-Hour Support:** Configurable time formats to suit your preference.
- ⚡ **Lightweight & Fast:** Optimized for YouTube's Single Page Application (SPA) dynamic navigation.
- 🔒 **Privacy-First:** Zero external API calls, analytics, or third-party tracking.
- 💾 **Smart Caching:** Efficiently caches metadata to prevent redundant requests.

---

## 📸 Screenshots

| Home Page | Watch Page |
| :---: | :---: |
| ![](screenshots/Home.png) | ![](screenshots/Watch.png) |

| Playlists | Shorts |
| :---: | :---: |
| ![](screenshots/Playlists.png) | ![](screenshots/Shorts.png) |

| Search Results | Live Streams |
| :---: | :---: |
| ![](screenshots/Search.png) | ![](screenshots/Live.png) |

---

## 📍 Supported Locations

| Location | Example Output |
| :--- | :--- |
| **Watch page description** | `4 Sep 2026, 11:15 pm` |
| **Home feed** | `4 Sep 2026, 11:15 pm` |
| **Search results** | `4 Sep 2026, 11:15 pm` |
| **Channel videos grid** | `4 Sep 2026, 11:15 pm` |
| **Playlist page & cards** | `4 Sep 2026, 11:15 pm` |
| **Shorts player & thumbnails** | `4 Sep 2026, 11:15 pm` |
| **End screen recommendations** | `4 Sep 2026, 11:15 pm` |
| **Watch page right sidebar** | `4 Sep 2026` |

---

## 💡 Example

| YouTube Default (Before) | With Script (After) |
| :--- | :--- |
| `3 years ago` | `12 Jul 2022, 10:15 pm` |
| `11 months ago` | `5 Sep 2024, 6:30 pm` |
| `2 weeks ago` | `10 Jun 2026, 8:00 am` |
| `Yesterday` | `8 Jul 2026, 5:42 pm` |

---

## 🚀 Quick Installation

1. Install a userscript manager extension for your browser:
   * [Violentmonkey](https://violentmonkey.github.io/) (*Recommended*)
   * [Tampermonkey](https://www.tampermonkey.net/)
   * [Greasemonkey](https://www.greasespot.net/)

2. Install the userscript:

<p align="center">
  <a href="https://greasyfork.org/en/scripts/588066">
    <img src="https://img.shields.io/badge/Install%20from-GreasyFork-800000?style=for-the-badge&logo=greasyfork" alt="Install from GreasyFork">
  </a>
</p>

---

## Configuration

Inside the script:

```javascript
var USE_12_HOUR = true;
```

| Value | Output |
|------|--------|
| `true` | `10 May 2025, 10:16 pm` |
| `false` | `10 May 2025, 22:16` |

---

## How it Works

The userscript retrieves each video's upload date directly from YouTube's internal API using your existing browser session.

It then replaces YouTube's relative timestamps (such as "2 years ago") with locale-aware absolute dates while preserving YouTube's original layout.

To remain lightweight, the script uses:

- Smart response caching
- Duplicate request prevention
- Automatic support for YouTube's dynamic page navigation

---

## Compatibility

| YouTube Section | Supported |
|-----------------|-----------|
| Home | ✅ |
| Search | ✅ |
| Watch | ✅ |
| Playlists | ✅ |
| Shorts | ✅ |
| Channel Videos | ✅ |
| Recommendations | ✅ |
| End Screen | ✅ |

Compatible with:

- ✔ Violentmonkey
- ✔ Greasemonkey
- ✔ Tampermonkey

---

## Privacy

This userscript:

- ❌ Collects no data
- ❌ Sends nothing to third-party servers
- ❌ Uses no analytics
- ❌ Requires no API keys

All requests are made directly to YouTube.

---

## Acknowledgements

This project was inspired by the following community userscripts:

- **[YouTube Date Display](https://greasyfork.org/scripts/561532)** by **kor-bim**
- **[YouTube Precise Date Display Fixed](https://greasyfork.org/en/scripts/567066)** by **Homebrew Runner**

Their work helped inspire the development of this userscript. This project has since been independently rewritten and expanded with broader YouTube support, locale-aware formatting, improved caching, and compatibility with modern YouTube layouts.

Many thanks to both authors for their contributions to the userscript community.

---

## Contributing

Issues, feature requests and pull requests are welcome.

If YouTube changes its layout and something breaks, feel free to open an [issue](https://github.com/PacificCosmophile/YouTube-Show-Absolute-Date/issues).

---

## License

[MIT License](https://opensource.org/licenses/MIT)

---

---

<p align="center">
Made with ❤️ for YouTube users who prefer actual upload dates.
</p>
