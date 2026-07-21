import * as state from './state.js';
import { PRESETS, INITIAL_SPEC } from './constants.js';
import { log } from './logger.js';
import { updateUIControls } from './ui.js';

// Save configuration to localStorage
export function saveSettings(spec) {
  localStorage.setItem('ytm_eq_enabled', JSON.stringify(state.isEqEnabled));
  localStorage.setItem('ytm_eq_preset', state.currentPreset);
  localStorage.setItem('ytm_eq_user_presets', JSON.stringify(state.userPresets));

  // Only overwrite custom spec if the EQ is actually enabled.
  // Otherwise we'd save the all-bypassed state!
  if (state.currentPreset === 'custom' && state.isEqEnabled) {
    localStorage.setItem('ytm_eq_custom_spec', JSON.stringify(spec));
  }
}

export function saveUserPreset(name, spec) {
  state.userPresets[name] = spec.map(filter => ({...filter})); // Deep copy
  saveSettings(spec);
  state.setCurrentPreset(name);
  updateUIControls();
}

export function deleteUserPreset(name) {
  delete state.userPresets[name];
  if (state.currentPreset === name) {
    state.setCurrentPreset('custom');
  }
  saveSettings(state.weq8.spec);
  updateUIControls();
}

export function saveSaturationSettings() {
  if (state.weq8) {
    localStorage.setItem('ytm_eq_output_gain', state.weq8.outputGain.toString());
    localStorage.setItem('ytm_eq_saturation_mode', state.weq8.saturationMode);
    localStorage.setItem('ytm_eq_saturation_threshold', state.weq8.saturationThreshold.toString());
  }
}

// Load configuration from localStorage
export function loadSettings() {
  try {
    const savedEnabled = localStorage.getItem('ytm_eq_enabled');
    const savedPreset = localStorage.getItem('ytm_eq_preset');
    const savedUserPresets = localStorage.getItem('ytm_eq_user_presets');
    const savedMono = localStorage.getItem('ytm_eq_mono');

    if (savedEnabled !== null) {
      state.setIsEqEnabled(JSON.parse(savedEnabled));
    }

    if (savedMono !== null) {
      state.setIsMonoEnabled(JSON.parse(savedMono));
    }

    if (savedUserPresets !== null) {
      state.setUserPresets(JSON.parse(savedUserPresets));
    }

    if (savedPreset !== null) {
      state.setCurrentPreset(savedPreset);
    }

    if (state.weq8) {
      const savedOutputGain = localStorage.getItem('ytm_eq_output_gain');
      if (savedOutputGain !== null) {
        state.weq8.outputGain = parseFloat(savedOutputGain);
      }
      const savedSatMode = localStorage.getItem('ytm_eq_saturation_mode') || 'none';
      const savedSatThreshold = localStorage.getItem('ytm_eq_saturation_threshold') || '1.0';
      state.weq8.setSaturationMode(savedSatMode, { threshold: parseFloat(savedSatThreshold) });
    }

    state.setIsApplyingPreset(true);

    try {
      if (state.currentPreset === 'custom') {
        const savedCustom = localStorage.getItem('ytm_eq_custom_spec');
        if (savedCustom) {
          const spec = JSON.parse(savedCustom);
          spec.forEach((filter, idx) => {
            if (state.weq8.spec[idx]) {
              state.weq8.setFilterType(idx, filter.type);
              state.weq8.setFilterFrequency(idx, filter.frequency);
              state.weq8.setFilterGain(idx, filter.gain);
              state.weq8.setFilterQ(idx, filter.Q);
              state.weq8.toggleBypass(idx, !state.isEqEnabled || filter.bypass);
            }
          });
        } else {
          // Fallback to flat if no custom spec saved
          INITIAL_SPEC.forEach((filter, idx) => {
            state.weq8.setFilterType(idx, filter.type);
            state.weq8.setFilterFrequency(idx, filter.frequency);
            state.weq8.setFilterGain(idx, filter.gain);
            state.weq8.setFilterQ(idx, filter.Q);
            state.weq8.toggleBypass(idx, !state.isEqEnabled || filter.bypass);
          });
        }
      } else if (state.userPresets[state.currentPreset]) {
        // Restore a saved user preset
        const spec = state.userPresets[state.currentPreset];
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
        // Load standard built-in spec
        const gains = PRESETS[state.currentPreset] || PRESETS['flat'];
        gains.forEach((gainVal, idx) => {
          const template = INITIAL_SPEC[idx];
          if (state.weq8.spec[idx]) {
            state.weq8.setFilterType(idx, template.type);
            state.weq8.setFilterFrequency(idx, template.frequency);
            state.weq8.setFilterGain(idx, gainVal);
            state.weq8.setFilterQ(idx, template.Q);
            state.weq8.toggleBypass(idx, !state.isEqEnabled);
          }
        });
      }
    } finally {
      state.setIsApplyingPreset(false);
    }

    // Sync the UI controls
    updateUIControls();
  } catch (e) {
    log.error('Failed to load equalizer settings', e);
  }
}
