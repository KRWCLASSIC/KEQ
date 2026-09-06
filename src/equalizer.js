import { WEQ8Runtime } from 'weq8c';
import * as state from './state.js';
import { PRESETS, INITIAL_SPEC } from './constants.js';
import { log } from './logger.js';
import { loadSettings, saveSettings } from './settings.js';
import { updateUIControls } from './ui.js';

let isEngineInitialized = false;
let stereoGain = null;
let monoPathGain = null;
let resumeListenersAttached = false;
const connectedMediaElements = new WeakSet();

// Setup global user gesture listeners to wake up AudioContext on any interaction
export function setupAudioResumeListeners() {
  if (resumeListenersAttached) return;
  resumeListenersAttached = true;

  const tryResume = () => {
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => {});
    }
  };

  // Interactions that satisfy browser autoplay policies
  const userEvents = ['click', 'keydown', 'pointerdown', 'touchstart', 'focus'];
  userEvents.forEach(evt => {
    window.addEventListener(evt, tryResume, { capture: true, passive: true });
    document.addEventListener(evt, tryResume, { capture: true, passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      tryResume();
    }
  });

  window.addEventListener('focus', tryResume, { passive: true });
}

// Ensure the singleton Web Audio API graph and WEQ8 runtime are created once
export function ensureAudioEngine() {
  if (isEngineInitialized && state.audioCtx && state.weq8) {
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => {});
    }
    return state.weq8;
  }

  log.info('Initializing singleton Web Audio Engine and Parametric Equalizer graph...');

  try {
    if (!state.audioCtx) {
      state.setAudioCtx(new (window.AudioContext || window.webkitAudioContext)());
    }

    state.setWeq8(new WEQ8Runtime(state.audioCtx));

    // Build Mono / Stereo Crossfade Graph
    stereoGain = state.audioCtx.createGain();
    monoPathGain = state.audioCtx.createGain();

    const splitter = state.audioCtx.createChannelSplitter(2);
    const merger = state.audioCtx.createChannelMerger(2);
    const sumGain = state.audioCtx.createGain();
    sumGain.gain.value = 0.5; // Prevent clipping when summing L+R

    monoPathGain.connect(splitter);
    splitter.connect(sumGain, 0); // L to sum
    splitter.connect(sumGain, 1); // R to sum
    sumGain.connect(merger, 0, 0); // sum to L
    sumGain.connect(merger, 0, 1); // sum to R

    stereoGain.gain.value = state.isMonoEnabled ? 0 : 1;
    monoPathGain.gain.value = state.isMonoEnabled ? 1 : 0;

    // Route: Media element source(s) -> WEQ8 input -> (Stereo || Mono) -> Destination
    state.weq8.connect(stereoGain);
    state.weq8.connect(monoPathGain);

    stereoGain.connect(state.audioCtx.destination);
    merger.connect(state.audioCtx.destination);

    // Expose mono toggle function
    window.__setMonoEnabled = (enabled) => {
      if (!state.audioCtx || !stereoGain || !monoPathGain) return;
      const now = state.audioCtx.currentTime;

      stereoGain.gain.cancelScheduledValues(now);
      stereoGain.gain.setValueAtTime(stereoGain.gain.value, now);
      stereoGain.gain.linearRampToValueAtTime(enabled ? 0 : 1, now + 0.05);

      monoPathGain.gain.cancelScheduledValues(now);
      monoPathGain.gain.setValueAtTime(monoPathGain.gain.value, now);
      monoPathGain.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + 0.05);
    };

    // Load persisted settings FIRST so runtime has correct spec
    loadSettings();

    // Attach to UI widget if present
    const widget = document.getElementById('eq-widget');
    if (widget) {
      widget.runtime = state.weq8;
    }

    // Save on filtersChanged
    state.weq8.on('filtersChanged', (spec) => {
      const currentSpecJSON = JSON.stringify(spec);
      if (currentSpecJSON === state.lastKnownSpecJSON) return;
      state.setLastKnownSpecJSON(currentSpecJSON);

      if (!state.isApplyingPreset) {
        state.setCurrentPreset('custom');
        updateUIControls();
      }
      saveSettings(spec);
    });

    setupAudioResumeListeners();
    isEngineInitialized = true;

    return state.weq8;
  } catch (error) {
    log.error('Failed to initialize AudioContext / Equalizer engine', error);
  }
}

// Connect a video / media element to the equalizer
export function connectVideo(video) {
  if (!video || !(video instanceof HTMLMediaElement)) return;

  if (connectedMediaElements.has(video) || video.__weq8_connected) {
    state.setActiveVideo(video);
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => {});
    }
    return;
  }

  try {
    ensureAudioEngine();

    log.info('Connecting media element to Parametric Equalizer...');
    video.__weq8_connected = true;
    connectedMediaElements.add(video);
    state.setActiveVideo(video);

    const source = state.audioCtx.createMediaElementSource(video);
    source.connect(state.weq8.input);
    state.setSourceNode(source);

    const resumeContextOnActivity = () => {
      state.setActiveVideo(video);
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }
    };

    ['play', 'playing', 'timeupdate', 'volumechange', 'canplay'].forEach(evt => {
      video.addEventListener(evt, resumeContextOnActivity, { passive: true });
    });

    if (!video.paused || video.readyState >= 2) {
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }
    }
  } catch (error) {
    log.error('Failed to connect video element to AudioContext', error);
  }
}

// Alias for backwards compatibility
export function initEqualizer(video) {
  if (video) {
    connectVideo(video);
  } else {
    ensureAudioEngine();
  }
}

// Set Equalizer Active / Bypass state
export function setEqEnabled(enabled) {
  state.setIsEqEnabled(enabled);
  if (!state.weq8) return;

  if (enabled) {
    // When re-enabling, apply the current preset to restore original bypass states from memory
    applyPreset(state.currentPreset);
    // Restore mono state
    if (typeof window.__setMonoEnabled === 'function') {
      window.__setMonoEnabled(state.isMonoEnabled);
    }
    // Restore output gain and saturation from saved settings
    const savedGain = localStorage.getItem('ytm_eq_output_gain');
    const savedMode = localStorage.getItem('ytm_eq_saturation_mode');
    const savedThresh = localStorage.getItem('ytm_eq_saturation_threshold');
    if (savedGain !== null) state.weq8.outputGain = parseFloat(savedGain);
    if (savedMode !== null && savedThresh !== null) {
      state.weq8.setSaturationMode(savedMode, { threshold: parseFloat(savedThresh) });
    }
  } else {
    try {
      state.setIsApplyingPreset(true);
      state.weq8.spec.forEach((filter, idx) => {
        state.weq8.toggleBypass(idx, true);
      });
      saveSettings(state.weq8.spec);
    } finally {
      state.setIsApplyingPreset(false);
    }
    // Force stereo when EQ disabled
    if (typeof window.__setMonoEnabled === 'function') {
      window.__setMonoEnabled(false);
    }
    // Neutralize output gain and saturation without saving over stored values
    state.weq8.outputGain = 1;
    state.weq8.setSaturationMode('none', { threshold: 1 });
  }

  updateUIControls();
}

// Apply Preset
export function applyPreset(presetName) {
  if (!state.weq8) return;

  state.setIsApplyingPreset(true);
  state.setCurrentPreset(presetName);

  try {
    if (presetName === 'custom') {
      const savedCustom = localStorage.getItem('ytm_eq_custom_spec');
      if (savedCustom) {
        const spec = JSON.parse(savedCustom);
        spec.forEach((filter, idx) => {
          if (state.weq8.spec[idx]) {
            state.weq8.setFilterType(idx, filter.type);
            state.weq8.setFilterFrequency(idx, filter.frequency);
            state.weq8.setFilterGain(idx, filter.gain);
            state.weq8.setFilterQ(idx, filter.Q);
            state.weq8.toggleBypass(idx, !state.isEqEnabled);
          }
        });
      }
    } else if (state.userPresets[presetName]) {
      const spec = state.userPresets[presetName];
      spec.forEach((filter, idx) => {
        if (state.weq8.spec[idx]) {
          state.weq8.setFilterType(idx, filter.type);
          state.weq8.setFilterFrequency(idx, filter.frequency);
          state.weq8.setFilterGain(idx, filter.gain);
          state.weq8.setFilterQ(idx, filter.Q);
          state.weq8.toggleBypass(idx, !state.isEqEnabled);
        }
      });
    } else {
      const gains = PRESETS[presetName] || PRESETS['flat'];
      gains.forEach((gainVal, idx) => {
        if (state.weq8.spec[idx]) {
          const template = INITIAL_SPEC[idx];
          state.weq8.setFilterType(idx, template.type);
          state.weq8.setFilterFrequency(idx, template.frequency);
          state.weq8.setFilterGain(idx, gainVal);
          state.weq8.setFilterQ(idx, template.Q);
          if (state.isEqEnabled) {
            state.weq8.toggleBypass(idx, false);
          }
        }
      });
    }

    updateUIControls();
    saveSettings(state.weq8.spec);
  } finally {
    state.setIsApplyingPreset(false);
  }
}

// Reset Equalizer to Flat
export function resetToFlat() {
  if (!state.weq8) return;

  state.setIsApplyingPreset(true);
  try {
    if (state.currentPreset !== 'custom') {
      state.setCurrentPreset('flat');
    }

    // Clear any saved custom parameters when fully resetting
    localStorage.removeItem('ytm_eq_custom_spec');

    INITIAL_SPEC.forEach((filter, idx) => {
      state.weq8.setFilterType(idx, filter.type);
      state.weq8.setFilterFrequency(idx, filter.frequency);
      state.weq8.setFilterGain(idx, filter.gain);
      state.weq8.setFilterQ(idx, filter.Q);
      if (state.isEqEnabled) {
        state.weq8.toggleBypass(idx, false);
      }
    });

    updateUIControls();
    saveSettings(state.weq8.spec);
  } finally {
    state.setIsApplyingPreset(false);
  }
}
