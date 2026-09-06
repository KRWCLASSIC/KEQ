import './bypass.js';
import { WEQ8UIElement } from 'weq8c/ui';
import { log } from './logger.js';
import { injectUI, setupDOMWatcher, injectYouTubeButton, detectAndConnectVideos, updateUIControls } from './ui.js';
import { ensureAudioEngine, setupAudioResumeListeners } from './equalizer.js';

const isYTM = location.hostname === 'music.youtube.com';

// Restore the adapter environment immediately after imports complete.
// This MUST run on both YouTube Music and regular YouTube — bypass.js patches
// window.HTMLElement and customElements.define at import time (needed so weq8-ui
// registers natively), and without restoring them the patched state persists
// for the entire page lifetime, breaking the host site's own custom elements.
if (typeof window.__keq_restore_bypass === 'function') {
  window.__keq_restore_bypass();
}

// YT Music lifecycle call safety patch (YTM only — Polymer-specific quirk)
if (isYTM) {
  try {
    const originalUpdated = WEQ8UIElement.prototype.updated;
    WEQ8UIElement.prototype.updated = function (changedProperties) {
      if (!changedProperties) {
        changedProperties = new Map();
      }
      return originalUpdated.call(this, changedProperties);
    };
  } catch (e) {
    log.error('Failed to patch WEQ8UIElement.updated', e);
  }
}

// Make the eq-widget host element fully invisible on both sites
try {
  WEQ8UIElement.addCustomStyles(`
    :host {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: none !important;
      box-shadow: none !important;
    }

    .visualisation {
      border-radius: 16px;
      overflow: hidden;
    }
  `);
} catch (e) {
  log.error('Failed to apply WEQ8 custom styles', e);
}

// Entry Point
function main() {
  log.info('KEQ Equalizer Extender initialized.');

  // Eagerly initialize AudioEngine & user gesture listeners
  ensureAudioEngine();
  setupAudioResumeListeners();

  // Inject UI elements (panel is the same on both sites)
  injectUI();

  // Watch for video hot-swaps & SPA navigation on both sites
  setupDOMWatcher();

  if (!isYTM) {
    // YouTube (standard): inject into the player controls
    injectYouTubeButton();
  }

  // Scan and connect any videos currently present
  detectAndConnectVideos();

  // Ensure all UI controls and button colors are synced to loaded state
  updateUIControls();
}

// Wait for DOM to load fully before running
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
