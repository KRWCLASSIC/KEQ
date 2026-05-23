import './bypass.js';
import { WEQ8Runtime } from 'weq8c';
import { WEQ8UIElement } from 'weq8c/ui';
import iconSvgText from '../icons/icon.svg';

// Restore YouTube Music's polyfill environment immediately after imports complete
if (typeof window.__keq_restore_bypass === 'function') {
  window.__keq_restore_bypass();
}

// Distinct stylized console logging for KEQ extension
const log = {
  info: (msg, ...args) => console.log('%c[KEQ]%c ' + msg, 'background: #ff0055; color: white; padding: 1px 4px; border-radius: 3px; font-weight: bold;', '', ...args),
  error: (msg, error, ...args) => {
    console.group('%c[KEQ ERROR]%c ' + msg, 'background: #ff0000; color: white; padding: 1px 4px; border-radius: 3px; font-weight: bold;', 'color: #ff0000; font-weight: bold;');
    if (error) console.error(error);
    console.groupEnd();
  }
};

// Patch WEQ8 elements to tolerate YT Music's potential lifecycle calls
try {
  // YT Music lifecycle call safety patch
  const originalUpdated = WEQ8UIElement.prototype.updated;
  WEQ8UIElement.prototype.updated = function (changedProperties) {
    if (!changedProperties) {
      changedProperties = new Map();
    }
    return originalUpdated.call(this, changedProperties);
  };

  // Make the eq-widget host element fully invisible (no background, border, or shadow)
  WEQ8UIElement.addCustomStyles(`
    :host {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: none !important;
      box-shadow: none !important;
    }
  `);

} catch (e) {
  log.error('Failed to patch WEQ8 elements', e);
}

// Styles for the Equalizer UI Panel and Button
const PANEL_STYLES = `


  /* Equalizer Panel */
  #ytm-eq-panel {
    position: fixed;
    right: 24px;
    bottom: -450px; /* Start hidden below screen */
    width: 660px;
    height: auto;
    background: rgba(18, 18, 18, 0.85);
    backdrop-filter: blur(25px) saturate(160%);
    -webkit-backdrop-filter: blur(25px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    z-index: 99999;
    padding: 16px;
    color: #fff;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
    transform: translateY(30px);
    pointer-events: none;
    font-family: 'Inter', sans-serif;
    color-scheme: dark !important;
  }
  
  #ytm-eq-panel.show {
    bottom: 88px; /* Place just above the bottom player bar */
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }
  
  /* Header section */
  .eq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .eq-title-container {
    display: flex;
    flex-direction: column;
  }
  
  .eq-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #ffcc00;
  }
  

  
  .eq-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  /* Neon Toggle Switch */
  .eq-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 22px;
  }
  
  .eq-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .eq-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: .3s;
    border-radius: 34px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .eq-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: #aaa;
    transition: .3s;
    border-radius: 50%;
  }
  
  .eq-switch input:checked + .eq-slider {
    background-color: rgba(255, 204, 0, 0.2);
    border-color: rgba(255, 204, 0, 0.4);
  }
  
  .eq-switch input:checked + .eq-slider:before {
    transform: translateX(22px);
    background-color: #ffcc00;
  }
  
  /* Dropdown styling */
  .eq-select {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #eee;
    padding: 5px 28px 5px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;
  }
  
  .eq-select:hover {
    background-color: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .eq-select:focus {
    border-color: #ffcc00;
  }

  .eq-select option {
    background: #181818;
    color: #eee;
  }
  
  .filterTypeSelect option {
    background-color: #222 !important;
    color: #eee !important;
  }
  
  /* Control buttons */
  .eq-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #eee;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .eq-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
  
  .eq-btn:active {
    transform: scale(0.96);
  }
  
  .eq-close-btn {
    background: transparent;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  
  .eq-close-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Widget area styling */
  .eq-body {
    width: 100%;
    overflow: hidden;
  }
`;

// Standard Equalizer Presets
const PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0],
  'bass-boost': [6.5, 5.0, 3.5, 1.0, 0.0, 0.0, 0.0, 0.0],
  'treble-boost': [0.0, 0.0, 0.0, 0.0, 1.5, 3.5, 5.0, 6.5],
  'vocal-boost': [-2.0, -1.0, 1.0, 3.5, 4.0, 3.0, 1.5, -1.0],
  dance: [5.5, 4.5, 1.5, -0.5, 2.0, 1.5, 3.5, 4.5],
  rock: [4.5, 3.0, -1.0, -2.0, 0.5, 2.0, 3.0, 4.5],
  pop: [-1.5, 1.5, 3.0, 2.0, -0.5, -1.0, 1.5, 2.5],
  classical: [3.5, 2.5, 1.5, 1.0, -1.0, -1.5, -0.5, 2.0]
};

// Initial layout (Standard 8-band setup)
const INITIAL_SPEC = [
  { type: "lowshelf12", frequency: 32, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 64, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 125, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 250, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 500, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 1000, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 2000, gain: 0, Q: 0.7, bypass: false },
  { type: "highshelf12", frequency: 8000, gain: 0, Q: 0.7, bypass: false }
];

let audioCtx = null;
let weq8 = null;
let sourceNode = null;
let activeVideo = null;
let isEqEnabled = true;
let currentPreset = 'flat';
let isApplyingPreset = false;
let lastKnownSpecJSON = null;

// Custom Shadow DOM styling removed. Utilizing default built-in component styles as requested.

// Save configuration to localStorage
function saveSettings(spec) {
  localStorage.setItem('ytm_eq_enabled', JSON.stringify(isEqEnabled));
  localStorage.setItem('ytm_eq_preset', currentPreset);

  // Only overwrite custom spec if the EQ is actually enabled.
  // Otherwise we'd save the all-bypassed state!
  if (currentPreset === 'custom' && isEqEnabled) {
    localStorage.setItem('ytm_eq_custom_spec', JSON.stringify(spec));
  }
}

// Load configuration from localStorage
function loadSettings() {
  try {
    const savedEnabled = localStorage.getItem('ytm_eq_enabled');
    const savedPreset = localStorage.getItem('ytm_eq_preset');

    if (savedEnabled !== null) {
      isEqEnabled = JSON.parse(savedEnabled);
    }

    if (savedPreset !== null) {
      currentPreset = savedPreset;
    }

    isApplyingPreset = true;

    if (currentPreset === 'custom') {
      const savedCustom = localStorage.getItem('ytm_eq_custom_spec');
      if (savedCustom) {
        const spec = JSON.parse(savedCustom);
        spec.forEach((filter, idx) => {
          if (weq8.spec[idx]) {
            weq8.setFilterType(idx, filter.type);
            weq8.setFilterFrequency(idx, filter.frequency);
            weq8.setFilterGain(idx, filter.gain);
            weq8.setFilterQ(idx, filter.Q);
            weq8.toggleBypass(idx, !isEqEnabled || filter.bypass);
          }
        });
      } else {
        // Fallback to flat if no custom spec saved
        INITIAL_SPEC.forEach((filter, idx) => {
          weq8.setFilterType(idx, filter.type);
          weq8.setFilterFrequency(idx, filter.frequency);
          weq8.setFilterGain(idx, filter.gain);
          weq8.setFilterQ(idx, filter.Q);
          weq8.toggleBypass(idx, !isEqEnabled || filter.bypass);
        });
      }
    } else {
      // Load standard template spec
      const gains = PRESETS[currentPreset] || PRESETS['flat'];
      gains.forEach((gainVal, idx) => {
        const template = INITIAL_SPEC[idx];
        if (weq8.spec[idx]) {
          weq8.setFilterType(idx, template.type);
          weq8.setFilterFrequency(idx, template.frequency);
          weq8.setFilterGain(idx, gainVal);
          weq8.setFilterQ(idx, template.Q);
          weq8.toggleBypass(idx, !isEqEnabled || template.bypass);
        }
      });
    }

    isApplyingPreset = false;

    // Sync the UI controls
    updateUIControls();
  } catch (e) {
    log.error('Failed to load equalizer settings', e);
  }
}

// Update the controls in our custom panel header
function updateUIControls() {
  const powerToggle = document.getElementById('eq-power');
  if (powerToggle) {
    powerToggle.checked = isEqEnabled;
  }

  const presetSelect = document.getElementById('eq-preset');
  if (presetSelect) {
    presetSelect.value = currentPreset;
  }

  // Update Toolbar Icon Colors
  const eqBtn = document.getElementById('ytm-eq-btn');
  const expandEqBtn = document.getElementById('ytm-expand-eq-btn');
  const activeColor = '#bebe5b';

  if (eqBtn) {
    eqBtn.style.color = isEqEnabled ? activeColor : '';
  }
  if (expandEqBtn) {
    expandEqBtn.style.color = isEqEnabled ? activeColor : '';
  }
}

// Initialize Web Audio Graph and WEQ8
function initEqualizer(video) {
  if (video.__weq8_connected) {
    // If already connected, just ensure context is active
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return;
  }

  log.info('Connecting YouTube Music player to Parametric Equalizer...');
  video.__weq8_connected = true;
  activeVideo = video;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create runtime
    weq8 = new WEQ8Runtime(audioCtx);

    // Create source from the video element
    sourceNode = audioCtx.createMediaElementSource(video);

    // Route: Media element -> Equalizer -> Speakers
    sourceNode.connect(weq8.input);
    weq8.connect(audioCtx.destination);

    // Inject the runtime into our custom UI component
    const widget = document.getElementById('eq-widget');
    if (widget) {
      widget.runtime = weq8;
    }

    // Load persisted settings
    loadSettings();

    // Listen to changes to save them
    weq8.on('filtersChanged', (spec) => {
      const currentSpecJSON = JSON.stringify(spec);
      if (currentSpecJSON === lastKnownSpecJSON) return; // Ignore identical state emits
      lastKnownSpecJSON = currentSpecJSON;

      if (!isApplyingPreset) {
        currentPreset = 'custom';
        updateUIControls();
      }
      saveSettings(spec);
    });

    // Automatically try to resume context on video play
    video.addEventListener('play', () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    });
  } catch (error) {
    log.error('Failed to initialize AudioContext / Equalizer', error);
  }
}

// Set Equalizer Active / Bypass state
function setEqEnabled(enabled) {
  isEqEnabled = enabled;
  if (!weq8) return;

  if (enabled) {
    // When re-enabling, apply the current preset to restore original bypass states from memory
    applyPreset(currentPreset);
  } else {
    isApplyingPreset = true;
    weq8.spec.forEach((filter, idx) => {
      weq8.toggleBypass(idx, true);
    });
    saveSettings(weq8.spec);
    isApplyingPreset = false;
  }

  updateUIControls();
}

// Apply Preset
function applyPreset(presetName) {
  if (!weq8) return;

  isApplyingPreset = true;
  currentPreset = presetName;

  if (presetName === 'custom') {
    const savedCustom = localStorage.getItem('ytm_eq_custom_spec');
    if (savedCustom) {
      const spec = JSON.parse(savedCustom);
      spec.forEach((filter, idx) => {
        if (weq8.spec[idx]) {
          weq8.setFilterType(idx, filter.type);
          weq8.setFilterFrequency(idx, filter.frequency);
          weq8.setFilterGain(idx, filter.gain);
          weq8.setFilterQ(idx, filter.Q);
          weq8.toggleBypass(idx, !isEqEnabled || filter.bypass);
        }
      });
    }
  } else {
    const gains = PRESETS[presetName] || PRESETS['flat'];
    gains.forEach((gainVal, idx) => {
      if (weq8.spec[idx]) {
        const template = INITIAL_SPEC[idx];
        weq8.setFilterType(idx, template.type);
        weq8.setFilterFrequency(idx, template.frequency);
        weq8.setFilterGain(idx, gainVal);
        weq8.setFilterQ(idx, template.Q);
        if (isEqEnabled) {
          weq8.toggleBypass(idx, false);
        }
      }
    });
  }

  updateUIControls();
  saveSettings(weq8.spec);
  isApplyingPreset = false;
}

// Reset Equalizer to Flat
function resetToFlat() {
  if (!weq8) return;

  isApplyingPreset = true;
  if (currentPreset !== 'custom') {
    currentPreset = 'flat';
  }

  // Clear any saved custom parameters when fully resetting
  localStorage.removeItem('ytm_eq_custom_spec');

  INITIAL_SPEC.forEach((filter, idx) => {
    weq8.setFilterType(idx, filter.type);
    weq8.setFilterFrequency(idx, filter.frequency);
    weq8.setFilterGain(idx, filter.gain);
    weq8.setFilterQ(idx, filter.Q);
    weq8.toggleBypass(idx, !isEqEnabled || filter.bypass);
  });

  updateUIControls();
  saveSettings(weq8.spec);
  isApplyingPreset = false;
}

// Inject HTML UI into the DOM
function injectUI() {
  if (document.getElementById('ytm-eq-panel')) return;

  // Inject Main Panel Styles
  const styleEl = document.createElement('style');
  styleEl.textContent = PANEL_STYLES;
  document.head.appendChild(styleEl);

  // Create Main Panel programmatically to completely bypass TrustedHTML constraints
  const panel = document.createElement('div');
  panel.id = 'ytm-eq-panel';

  const header = document.createElement('div');
  header.className = 'eq-header';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'eq-title-container';

  const titleRow = document.createElement('div');
  titleRow.style.display = 'flex';
  titleRow.style.alignItems = 'center';
  titleRow.style.gap = '8px';

  const titleIcon = new DOMParser().parseFromString(iconSvgText, 'image/svg+xml').documentElement;
  titleIcon.setAttribute('width', '28');
  titleIcon.setAttribute('height', '28');
  titleIcon.style.flexShrink = '0';
  titleIcon.style.display = 'block';
  // Make the background circle transparent so it blends with the panel
  const iconBgCircle = titleIcon.querySelector('circle');
  if (iconBgCircle) iconBgCircle.setAttribute('fill', 'transparent');

  const title = document.createElement('span');
  title.className = 'eq-title';
  title.textContent = 'KEQ';

  const githubBadge = document.createElement('a');
  githubBadge.href = 'https://github.com/KRWCLASSIC/KEQ';
  githubBadge.target = '_blank';
  const githubImg = document.createElement('img');
  githubImg.src = 'https://img.shields.io/badge/GitHub-KEQ-blue?logo=github';
  githubImg.style.height = '16px';
  githubImg.style.display = 'block';
  githubBadge.appendChild(githubImg);

  const donateBadge = document.createElement('a');
  donateBadge.href = 'https://paypal.me/krwclassic';
  donateBadge.target = '_blank';
  const donateImg = document.createElement('img');
  donateImg.src = 'https://img.shields.io/badge/Donate-PayPal-yellow?logo=paypal';
  donateImg.style.height = '16px';
  donateImg.style.display = 'block';
  donateBadge.appendChild(donateImg);

  titleRow.appendChild(titleIcon);
  titleRow.appendChild(title);
  titleRow.appendChild(githubBadge);
  titleRow.appendChild(donateBadge);

  titleContainer.appendChild(titleRow);

  const controls = document.createElement('div');
  controls.className = 'eq-controls';

  const select = document.createElement('select');
  select.id = 'eq-preset';
  select.className = 'eq-select';
  select.title = 'Equalizer Presets';

  const presetsList = [
    { value: 'custom', label: 'Custom' },
    { value: 'flat', label: 'Flat' },
    { value: 'bass-boost', label: 'Bass Boost' },
    { value: 'treble-boost', label: 'Treble Boost' },
    { value: 'vocal-boost', label: 'Vocal Boost' },
    { value: 'dance', label: 'Electronic' },
    { value: 'rock', label: 'Rock' },
    { value: 'pop', label: 'Pop' },
    { value: 'classical', label: 'Classical' }
  ];
  presetsList.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.value;
    opt.textContent = p.label;
    select.appendChild(opt);
  });

  const resetBtn = document.createElement('button');
  resetBtn.id = 'eq-reset';
  resetBtn.className = 'eq-btn';
  resetBtn.textContent = 'Reset';

  const label = document.createElement('label');
  label.className = 'eq-switch';
  label.title = 'Toggle Equalizer';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = 'eq-power';
  input.checked = true;

  const slider = document.createElement('span');
  slider.className = 'eq-slider';

  label.appendChild(input);
  label.appendChild(slider);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'eq-close';
  closeBtn.className = 'eq-close-btn';
  closeBtn.title = 'Close Panel';
  closeBtn.textContent = '×';

  controls.appendChild(select);
  controls.appendChild(resetBtn);
  controls.appendChild(label);
  controls.appendChild(closeBtn);

  header.appendChild(titleContainer);
  header.appendChild(controls);

  const body = document.createElement('div');
  body.className = 'eq-body';

  const widget = document.createElement('weq8-ui');
  widget.id = 'eq-widget';
  body.appendChild(widget);

  panel.appendChild(header);
  panel.appendChild(body);
  document.body.appendChild(panel);

  // Create Toolbar Button programmatically
  const eqButton = document.createElement('yt-icon-button');
  eqButton.id = 'ytm-eq-btn';
  eqButton.title = 'Equalizer';
  // Use the 'shuffle' class to piggyback on YouTube Music's CSS that auto-hides it when the screen is too narrow
  eqButton.className = 'shuffle style-scope ytmusic-player-bar';
  eqButton.setAttribute('aria-haspopup', 'true');

  // Create SVG programmatically
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.style.width = '24px';
  svg.style.height = '24px';
  svg.style.display = 'block';
  svg.style.pointerEvents = 'none';
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const lines = [
    { x1: 4, y1: 21, x2: 4, y2: 14 },
    { x1: 4, y1: 10, x2: 4, y2: 3 },
    { x1: 12, y1: 21, x2: 12, y2: 12 },
    { x1: 12, y1: 8, x2: 12, y2: 3 },
    { x1: 20, y1: 21, x2: 20, y2: 16 },
    { x1: 20, y1: 12, x2: 20, y2: 3 }
  ];
  lines.forEach(l => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', l.x1);
    line.setAttribute('y1', l.y1);
    line.setAttribute('x2', l.x2);
    line.setAttribute('y2', l.y2);
    svg.appendChild(line);
  });
  const circles = [
    { cx: 4, cy: 12, r: 2 },
    { cx: 12, cy: 10, r: 2 },
    { cx: 20, cy: 14, r: 2 }
  ];
  circles.forEach(c => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', c.cx);
    circle.setAttribute('cy', c.cy);
    circle.setAttribute('r', c.r);
    circle.setAttribute('fill', 'currentColor');
    svg.appendChild(circle);
  });

  // Wrap SVG in a flex container that fills the button to guarantee perfect centering
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.appendChild(svg);

  eqButton.appendChild(wrapper);

  // Create a clone for the Expanding Menu (drawer) for narrow screens
  const expandEqButton = document.createElement('yt-icon-button');
  expandEqButton.id = 'ytm-expand-eq-btn';
  expandEqButton.title = 'Equalizer';
  expandEqButton.className = 'expand-shuffle style-scope ytmusic-player-bar';
  expandEqButton.setAttribute('aria-haspopup', 'true');
  expandEqButton.setAttribute('slot', 'elements');
  expandEqButton.appendChild(wrapper.cloneNode(true));

  // Set up Event Listeners
  const togglePanel = () => {
    const isShowing = panel.classList.contains('show');
    if (isShowing) {
      panel.classList.remove('show');
      eqButton.classList.remove('active');
      expandEqButton.classList.remove('active');
    } else {
      panel.classList.add('show');
      eqButton.classList.add('active');
      expandEqButton.classList.add('active');

      // Ensure the AudioContext and EQ are connected when opening the panel
      const video = document.querySelector('video');
      if (video) {
        initEqualizer(video);
      }

      // Resume context (browsers block initial context sometimes)
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Force visualizer redraw as the panel slides open and takes physical dimensions
      const forceRedraw = () => {
        if (weq8 && weq8.emitter) {
          const wasApplying = isApplyingPreset;
          isApplyingPreset = true; // Prevent overriding preset state
          weq8.emitter.emit('filtersChanged', weq8.spec);
          isApplyingPreset = wasApplying;
        }
      };
      setTimeout(forceRedraw, 50);
      setTimeout(forceRedraw, 150);
      setTimeout(forceRedraw, 350);
    }
  };

  eqButton.addEventListener('click', togglePanel);
  expandEqButton.addEventListener('click', togglePanel);

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('show');
    eqButton.classList.remove('active');
    expandEqButton.classList.remove('active');
  });

  input.addEventListener('change', (e) => {
    setEqEnabled(e.target.checked);
  });

  select.addEventListener('change', (e) => {
    applyPreset(e.target.value);
  });

  resetBtn.addEventListener('click', () => {
    resetToFlat();
  });

  // Attempt to inject the button in the bottom right player bar controls
  injectButtonLoop(eqButton, expandEqButton);
}

// Look for right-controls-buttons and inject our button there
function injectButtonLoop(button, expandButton) {
  const insertBtn = () => {
    // Query selectors for YouTube Music's player bar controls
    const rightControls = document.querySelector('ytmusic-player-bar .right-controls-buttons');
    const expandingMenu = document.getElementById('expanding-menu');
    let injected = false;

    if (rightControls && !document.getElementById('ytm-eq-btn')) {
      // Insert just before the expand controls so it groups with the repeat/shuffle buttons
      const expandBtn = rightControls.querySelector('.expand-button');
      if (expandBtn) {
        rightControls.insertBefore(button, expandBtn);
      } else {
        rightControls.appendChild(button);
      }
      injected = true;
    }

    if (expandingMenu && !document.getElementById('ytm-expand-eq-btn')) {
      expandingMenu.appendChild(expandButton);
      injected = true;
    }

    if (injected) {
      log.info('Equalizer buttons successfully injected into Player Bar.');

      // Once injected, look for active video elements immediately to initialize backend hooks silently
      const video = document.querySelector('video');
      if (video) {
        // Run silent init (without showing panel)
        initEqualizer(video);
      }
      return true;
    }
    return false;
  };

  if (!insertBtn()) {
    const interval = setInterval(() => {
      if (insertBtn()) {
        clearInterval(interval);
      }
    }, 1000);
  }
}

// Watch for DOM mutations to catch video elements if they are hot-swapped
function setupDOMWatcher() {
  const observer = new MutationObserver((mutations) => {
    const video = document.querySelector('video');
    if (video && !video.__weq8_connected) {
      initEqualizer(video);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Entry Point
function main() {
  log.info('YouTube Music Parametric Equalizer Extender initialized.');

  // Inject UI elements
  injectUI();

  // Monitor DOM for new video elements
  setupDOMWatcher();
}

// Wait for DOM to load fully before running
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
