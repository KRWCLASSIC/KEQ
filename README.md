# YouTube Music Studio Equalizer (KEQ)

A premium, open-source 8-band studio parametric equalizer integrated directly into YouTube Music. Built as a lightweight Chromium Manifest V3 extension, it hooks into YouTube Music's HTML5 media engine using the Web Audio API and provides a gorgeous, glassmorphic control dashboard.

Powered by [weq8](https://github.com/teropa/weq8), which replicates the experience and accuracy of Ableton Live's legendary "EQ Eight" equalizer.

## Features

- **Direct Native Integration**: Adds a sleek equalizer icon button directly into the bottom-right playback controls bar of YouTube Music. No external popups required.
- **8-Band Parametric Filter Bank**: Replaces generic graphic equalizers with a real studio-grade parametric equalizer containing:
  - Band 1: Low Shelf (Sub-bass, ~32Hz)
  - Bands 2-7: Peaking Filters (Bass, Low-mids, Midrange, High-mids, Presence)
  - Band 8: High Shelf (Treble, ~8000Hz)
- **Interactive Visualizer & Real-time Graph**: Includes an interactive canvas graph drawing both the **frequency response curve** of the equalizer and a **real-time audio spectrum analyser** mapping your music!
- **Sleek Dark Glassmorphism**: Tailored to blend seamlessly with YouTube Music's dark mode, featuring a premium frosted-glass overlay panel with subtle neon styling.
- **Audio Presets**: Pre-configured acoustic curves for rapid adjustments, including:
  - *Bass Boost*, *Treble Boost*, *Vocal Boost*, *Electronic/Dance*, *Rock*, *Pop*, *Classical*, and *Flat*.
- **On/Off Toggle & Hard Bypass**: Easily enable or disable the entire equalizer with a glowing neon slider. When disabled, filters are bypassed at the native node level to conserve CPU.
- **Zero-Latency Persistence**: Saves and restores your exact EQ curves automatically via `localStorage`.

---

## Developer Guide & Building

The extension compiles `weq8`, its `Lit` dependencies, and custom UI components into a single highly optimized, minified `dist/inject.bundle.js` script of only **~58KB**. This is loaded directly in the page context (`MAIN` world) to completely bypass Cross-Origin Resource Sharing (CORS) blocks on media streams.

### Prerequisites

You need [Node.js](https://nodejs.org) installed to build the project.

### Installation

1. Clone or download this repository.
2. Initialize dependencies:
   ```bash
   npm install
   ```

### Building the Extension

To compile the bundle using `esbuild` (a lightning-fast build tool already configured for you):
```bash
npx esbuild src/inject.js --bundle --minify --outfile=dist/inject.bundle.js --platform=browser
```

Or you can add a build script in `package.json` for convenience.

---

## Loading into Chromium (Chrome, Brave, Edge, Opera)

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`
   - **Edge**: `edge://extensions/`
2. Enable **Developer mode** (usually a toggle switch in the top-right corner).
3. Click the **Load unpacked** button in the top-left corner.
4. Select the root folder of this project (`KEQ`) where `manifest.json` is located.
5. Go to [YouTube Music](https://music.youtube.com) and start playing! You'll see the equalizer icon appear in the bottom-right corner next to the player controls.

---

## License

This project is fully open source. 
- The equalizer core and UI are powered by [weq8](https://github.com/teropa/weq8), licensed under the **ISC License**. The license text is available in [WEQ8_LICENSE.md](./WEQ8_LICENSE.md).
- Custom extension code is open source and available for any non-commercial or commercial reuse under the MIT License.
