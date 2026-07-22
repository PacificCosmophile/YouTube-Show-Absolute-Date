# YouTube Show Absolute Date

Replace YouTube's relative upload dates (like **"2 years ago"**) with precise, locale-aware **absolute dates** across YouTube.

![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-YouTube-red)
![Userscript](https://img.shields.io/badge/userscript-Violentmonkey-blue)
![Version](https://img.shields.io/badge/version-1.0-orange)

---

## ✨ Features

- 📅 Replaces **relative upload dates** with **absolute dates**
- 🌍 Uses your browser's locale automatically
- 🕒 Supports both **12-hour** and **24-hour** time formats
- ⚡ Fast and lightweight
- 🔒 No external APIs or API keys required
- 💾 Smart caching to minimize network requests

---

## Supported Locations

| Location | Format |
|----------|--------|
| Watch page description | ✅ `4 Sep 2026, 11:15 pm` |
| Home | ✅ `4 Sep 2026, 11:15 pm` |
| Search | ✅ `4 Sep 2026, 11:15 pm` |
| Channel videos | ✅ `4 Sep 2026, 11:15 pm` |
| Playlist page | ✅ `4 Sep 2026, 11:15 pm` |
| Playlist cards | ✅ `4 Sep 2026, 11:15 pm` |
| Shorts player | ✅ `4 Sep 2026, 11:15 pm` |
| Shorts thumbnails | ✅ `4 Sep 2026, 11:15 pm` |
| End screen recommendations | ✅ `4 Sep 2026, 11:15 pm` |
| Watch page right sidebar | ✅ `4 Sep 2026` |

---

## Example

### Before

```
3 years ago
11 months ago
2 weeks ago
Yesterday
```

### After

```
12 Jul 2022, 10:15 pm
5 Sep 2024, 6:30 pm
10 Jun 2026, 8:00 am
8 Jul 2026, 5:42 pm
```

---

## Installation

### Step 1

Install a userscript manager:

- [Violentmonkey](https://violentmonkey.github.io/) (Recommended)
- [Greasemonkey](https://www.greasespot.net/)
- [Tampermonkey](https://www.tampermonkey.net/)

### Step 2

Install the script from GreasyFork.

*(Link will be added after publishing.)*

---

## Configuration

Inside the script:

```javascript
var USE_12_HOUR = true;
```

Set

```javascript
true
```

for

```
10 May 2025, 10:16 pm
```

or

```javascript
false
```

for

```
10 May 2025, 22:16
```

---

## How it Works

The script requests each video's upload date directly from YouTube's internal API using your existing browser session.

It then replaces YouTube's relative timestamps with precise upload dates while keeping the page layout unchanged.

To keep the script lightweight and responsive:

- Upload dates are cached
- Duplicate requests are avoided
- Dynamic page navigation is fully supported

---

## Compatibility

Works with:

- ✔ Home
- ✔ Search
- ✔ Watch
- ✔ Playlists
- ✔ Shorts
- ✔ Channel pages
- ✔ Recommendations
- ✔ End screens

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

This project was inspired by earlier community userscripts that explored replacing YouTube's relative upload dates with precise upload dates.

Special thanks to the authors of the following projects:

- **[YouTube Date Display](https://greasyfork.org/scripts/561532)** — by **kor-bim**
- **[YouTube Precise Date Display Fixed](https://greasyfork.org/en/scripts/567066)** — by **Homebrew Runner**

Their work laid the foundation for this project and inspired many of the ideas implemented here.

This userscript has since been extensively expanded and improved with features including:

- Locale-aware date formatting
- Configurable 12-hour / 24-hour time display
- Smart request caching and duplicate request prevention
- Support for Home, Search, Channel Videos, and Playlists
- Support for Playlist cards
- Support for Shorts player and Shorts thumbnails
- Support for End screen recommendations
- Compact dates in the Watch page right sidebar
- Improved compatibility with YouTube's modern layouts and dynamic navigation

Thank you to both authors for their contributions to the userscript community.

---

## Contributing

Issues, feature requests and pull requests are welcome.

If YouTube changes its layout and something breaks, feel free to open an [issue](https://github.com/PacificCosmophile/YouTube-Show-Absolute-Date/issues).

---

## License

[MIT License](https://opensource.org/licenses/MIT)

---

Made with ❤️ for YouTube users who prefer actual upload dates.
