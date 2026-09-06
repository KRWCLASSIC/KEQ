import iconSvgText from '../icons/icon.svg';
import { version } from '../manifest.json';
import * as state from './state.js';
import { PANEL_STYLES } from './styles.js';
import { saveUserPreset, deleteUserPreset } from './settings.js';
import { ensureAudioEngine, connectVideo, initEqualizer, setEqEnabled, applyPreset, resetToFlat } from './equalizer.js';
import { log } from './logger.js';

// Update the controls in our custom panel header
export function updateUIControls() {
  const powerToggle = document.getElementById('eq-power');
  if (powerToggle) {
    powerToggle.checked = state.isEqEnabled;
  }

  const presetCurrent = document.getElementById('eq-preset-current');
  if (presetCurrent) {
    let label = state.currentPreset;
    if (state.currentPreset !== 'custom' && !state.userPresets[state.currentPreset]) {
      const builtins = {
        'flat': 'Flat', 'bass-boost': 'Bass Boost', 'treble-boost': 'Treble Boost',
        'vocal-boost': 'Vocal Boost', 'dance': 'Electronic', 'rock': 'Rock',
        'pop': 'Pop', 'classical': 'Classical'
      };
      label = builtins[state.currentPreset] || state.currentPreset;
    } else if (state.currentPreset === 'custom') {
      label = 'Custom';
    }
    presetCurrent.textContent = label;
  }

  const customSelectContainer = document.getElementById('eq-preset-dropdown');
  if (customSelectContainer && typeof customSelectContainer._renderDropdown === 'function') {
    // Only re-render if it's open to update the active state, or if we want it always synced.
    // Let's just render it. It's cheap.
    customSelectContainer._renderDropdown();
  }

  // Update Toolbar Icon Colors
  const activeColor = '#bebe5b';
  const buttons = document.querySelectorAll('#ytm-eq-btn, #ytm-expand-eq-btn');
  buttons.forEach(btn => {
    btn.style.color = state.isEqEnabled ? activeColor : '';
  });
}

// Inject HTML UI into the DOM
export function injectUI() {
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

  const svgNoBg = iconSvgText.replace(/(<circle\b[^>]*?)(\bfill="[^"]*")([^>]*?>)/g, '$1fill="transparent"$3');
  const titleIcon = document.createElement('img');
  titleIcon.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgNoBg);
  titleIcon.setAttribute('width', '28');
  titleIcon.setAttribute('height', '28');
  titleIcon.style.flexShrink = '0';
  titleIcon.style.display = 'block';

  const titleTextGroup = document.createElement('div');
  titleTextGroup.style.display = 'flex';
  titleTextGroup.style.flexDirection = 'column';
  titleTextGroup.style.lineHeight = '1.2';

  const title = document.createElement('span');
  title.className = 'eq-title';
  title.textContent = 'KEQ';

  const versionLabel = document.createElement('span');
  versionLabel.textContent = `v${version}`;
  versionLabel.style.fontSize = '10px';
  versionLabel.style.color = 'rgba(255,255,255,0.35)';
  versionLabel.style.letterSpacing = '0.04em';
  versionLabel.style.fontWeight = '500';

  titleTextGroup.appendChild(title);
  titleTextGroup.appendChild(versionLabel);

  const badgesContainer = document.createElement('div');
  badgesContainer.style.display = 'flex';
  badgesContainer.style.flexDirection = 'column';
  badgesContainer.style.gap = '4px';
  badgesContainer.style.alignItems = 'flex-start';

  const githubRow = document.createElement('div');
  githubRow.style.display = 'flex';
  githubRow.style.gap = '6px';

  const githubBadge = document.createElement('a');
  githubBadge.href = 'https://github.com/KRWCLASSIC/KEQ';
  githubBadge.target = '_blank';
  const githubImg = document.createElement('img');
  githubImg.src = 'https://img.shields.io/badge/GitHub-KEQ-blue?logo=github';
  githubImg.style.height = '16px';
  githubImg.style.display = 'block';
  githubBadge.appendChild(githubImg);

  const weq8cBadge = document.createElement('a');
  weq8cBadge.href = 'https://github.com/KRWCLASSIC/WEQ8C';
  weq8cBadge.target = '_blank';
  const weq8cImg = document.createElement('img');
  weq8cImg.src = 'https://img.shields.io/badge/GitHub-WEQ8C-blue?logo=github';
  weq8cImg.style.height = '16px';
  weq8cImg.style.display = 'block';
  weq8cBadge.appendChild(weq8cImg);

  githubRow.appendChild(githubBadge);
  githubRow.appendChild(weq8cBadge);

  const donateBadge = document.createElement('a');
  donateBadge.href = 'https://paypal.me/krwclassic';
  donateBadge.target = '_blank';
  const donateImg = document.createElement('img');
  donateImg.src = 'https://img.shields.io/badge/Donate-PayPal-yellow?logo=paypal';
  donateImg.style.height = '16px';
  donateImg.style.display = 'block';
  donateBadge.appendChild(donateImg);

  badgesContainer.appendChild(githubRow);
  badgesContainer.appendChild(donateBadge);

  titleRow.appendChild(titleIcon);
  titleRow.appendChild(titleTextGroup);
  titleRow.appendChild(badgesContainer);

  titleContainer.appendChild(titleRow);

  const controls = document.createElement('div');
  controls.className = 'eq-controls';

  const customSelectContainer = document.createElement('div');
  customSelectContainer.id = 'eq-preset-dropdown';
  customSelectContainer.className = 'eq-custom-select-container';

  const selectCurrent = document.createElement('div');
  selectCurrent.id = 'eq-preset-current';
  selectCurrent.className = 'eq-select-current';
  let initialLabel = state.currentPreset;
  if (state.currentPreset !== 'custom' && !state.userPresets[state.currentPreset]) {
    const builtins = {
      'flat': 'Flat', 'bass-boost': 'Bass Boost', 'treble-boost': 'Treble Boost',
      'vocal-boost': 'Vocal Boost', 'dance': 'Electronic', 'rock': 'Rock',
      'pop': 'Pop', 'classical': 'Classical'
    };
    initialLabel = builtins[state.currentPreset] || state.currentPreset;
  } else if (state.currentPreset === 'custom') {
    initialLabel = 'Custom';
  }
  selectCurrent.textContent = initialLabel || 'Flat';
  selectCurrent.title = 'Equalizer Presets';

  const selectMenuWrap = document.createElement('div');
  selectMenuWrap.className = 'eq-select-menu-wrap';

  const selectMenu = document.createElement('div');
  selectMenu.className = 'eq-select-menu';

  selectMenuWrap.appendChild(selectMenu);

  const renderDropdown = () => {
    while (selectMenu.firstChild) {
      selectMenu.removeChild(selectMenu.firstChild);
    }
    
    const actions = document.createElement('div');
    actions.className = 'eq-select-actions';

    const inputNewName = document.createElement('input');
    inputNewName.type = 'text';
    inputNewName.id = 'eq-new-preset-name';
    inputNewName.placeholder = 'Preset name...';
    inputNewName.addEventListener('click', e => e.stopPropagation());
    inputNewName.addEventListener('keydown', e => {
      if (e.key === 'Enter' && inputNewName.value.trim()) {
        saveBtn.click();
      }
    });

    const saveBtn = document.createElement('button');
    saveBtn.id = 'eq-save-preset-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = inputNewName.value.trim();
      if (val && state.weq8) {
        saveUserPreset(val, state.weq8.spec);
        inputNewName.value = '';
        renderDropdown();
        customSelectContainer.classList.remove('open');
      }
    });

    actions.appendChild(inputNewName);
    actions.appendChild(saveBtn);
    selectMenu.appendChild(actions);

    const userPresetKeys = Object.keys(state.userPresets);
    if (userPresetKeys.length > 0) {
      const userGroup = document.createElement('div');
      userGroup.className = 'eq-select-group';
      userGroup.textContent = 'My Presets';
      selectMenu.appendChild(userGroup);

      userPresetKeys.forEach(name => {
        const opt = document.createElement('div');
        opt.className = 'eq-select-option' + (state.currentPreset === name ? ' active' : '');
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        opt.appendChild(nameSpan);

        const delBtn = document.createElement('span');
        delBtn.className = 'eq-preset-delete';
        delBtn.textContent = '×';
        delBtn.title = 'Delete Preset';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteUserPreset(name);
          renderDropdown();
        });

        opt.appendChild(delBtn);

        opt.addEventListener('click', () => {
          applyPreset(name);
          customSelectContainer.classList.remove('open');
        });
        selectMenu.appendChild(opt);
      });
    }

    const builtinGroup = document.createElement('div');
    builtinGroup.className = 'eq-select-group';
    builtinGroup.textContent = 'Built-in';
    selectMenu.appendChild(builtinGroup);

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
      const opt = document.createElement('div');
      opt.className = 'eq-select-option' + (state.currentPreset === p.value ? ' active' : '');
      opt.textContent = p.label;
      opt.addEventListener('click', () => {
        applyPreset(p.value);
        customSelectContainer.classList.remove('open');
      });
      selectMenu.appendChild(opt);
    });
  };

  renderDropdown();

  selectCurrent.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customSelectContainer.classList.contains('open');
    if (!isOpen) {
      renderDropdown();
    }
    customSelectContainer.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!customSelectContainer.contains(e.target)) {
      customSelectContainer.classList.remove('open');
    }
  });

  const scrollbar = document.createElement('div');
  scrollbar.className = 'eq-custom-scrollbar';
  const scrollbarThumb = document.createElement('div');
  scrollbarThumb.className = 'eq-custom-scrollbar-thumb';
  scrollbar.appendChild(scrollbarThumb);

  const updateScrollbar = () => {
    const contentHeight = selectMenu.scrollHeight;
    const viewHeight = selectMenu.clientHeight;
    if (contentHeight > viewHeight && viewHeight > 0) {
      scrollbar.classList.add('visible');
      const ratio = viewHeight / contentHeight;
      const thumbHeight = Math.max(ratio * viewHeight, 20); // min 20px
      scrollbarThumb.style.height = `${thumbHeight}px`;
      
      const scrollRatio = selectMenu.scrollTop / (contentHeight - viewHeight);
      const maxThumbTop = viewHeight - thumbHeight;
      scrollbarThumb.style.top = `${scrollRatio * maxThumbTop}px`;
    } else {
      scrollbar.classList.remove('visible');
    }
  };

  selectMenu.addEventListener('scroll', updateScrollbar);
  // Resize observer to update scrollbar if items change
  new ResizeObserver(updateScrollbar).observe(selectMenu);

  // Dragging logic
  let isDraggingScroll = false;
  let startY = 0;
  let startScrollTop = 0;

  scrollbarThumb.addEventListener('mousedown', (e) => {
    isDraggingScroll = true;
    startY = e.clientY;
    startScrollTop = selectMenu.scrollTop;
    scrollbarThumb.classList.add('dragging');
    document.body.style.userSelect = 'none'; // Prevent text selection
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingScroll) return;
    const deltaY = e.clientY - startY;
    
    const contentHeight = selectMenu.scrollHeight;
    const viewHeight = selectMenu.clientHeight;
    const thumbHeight = parseFloat(scrollbarThumb.style.height);
    const maxThumbTop = viewHeight - thumbHeight;
    
    // Calculate how much scrollTop changes per pixel of thumb movement
    const scrollPerPixel = (contentHeight - viewHeight) / maxThumbTop;
    
    selectMenu.scrollTop = startScrollTop + (deltaY * scrollPerPixel);
  });

  document.addEventListener('mouseup', () => {
    if (isDraggingScroll) {
      isDraggingScroll = false;
      scrollbarThumb.classList.remove('dragging');
      document.body.style.userSelect = '';
    }
  });

  selectMenuWrap.appendChild(scrollbar);

  customSelectContainer.appendChild(selectCurrent);
  customSelectContainer.appendChild(selectMenuWrap);
  customSelectContainer._renderDropdown = renderDropdown;

  const resetBtn = document.createElement('button');
  resetBtn.id = 'eq-reset';
  resetBtn.className = 'eq-btn';
  resetBtn.textContent = 'Reset';

  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'eq-settings';
  settingsBtn.className = 'eq-btn';
  settingsBtn.textContent = 'Settings';

  const label = document.createElement('label');
  label.className = 'eq-switch';
  label.title = 'Toggle Equalizer';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = 'eq-power';
  input.checked = state.isEqEnabled;

  const slider = document.createElement('span');
  slider.className = 'eq-slider';

  label.appendChild(input);
  label.appendChild(slider);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'eq-close';
  closeBtn.className = 'eq-close-btn';
  closeBtn.title = 'Close Panel';
  closeBtn.textContent = '×';

  controls.appendChild(customSelectContainer);
  controls.appendChild(resetBtn);
  controls.appendChild(settingsBtn);
  controls.appendChild(label);
  controls.appendChild(closeBtn);

  header.appendChild(titleContainer);
  header.appendChild(controls);

  const body = document.createElement('div');
  body.className = 'eq-body';

  const widget = document.createElement('weq8-ui');
  widget.id = 'eq-widget';
  if (state.weq8) {
    widget.runtime = state.weq8;
  }
  body.appendChild(widget);

  // Build the Settings Overlay
  const settingsOverlay = document.createElement('div');
  settingsOverlay.id = 'eq-settings-overlay';
  settingsOverlay.className = 'eq-settings-overlay';

  const settingsHeader = document.createElement('div');
  settingsHeader.className = 'eq-settings-header';

  const settingsTitle = document.createElement('span');
  settingsTitle.className = 'eq-settings-title';
  settingsTitle.textContent = 'Advanced Settings';

  const settingsClose = document.createElement('button');
  settingsClose.className = 'eq-close-btn';
  settingsClose.textContent = '×';
  settingsClose.title = 'Back to Equalizer';

  settingsHeader.appendChild(settingsTitle);
  settingsHeader.appendChild(settingsClose);
  settingsOverlay.appendChild(settingsHeader);



  // Output Gain Row (Read/Write)
  const outputRow = document.createElement('div');
  outputRow.className = 'eq-settings-row';
  const outputLabel = document.createElement('span');
  outputLabel.className = 'eq-settings-label';
  outputLabel.textContent = 'Output Gain';
  const outputControl = document.createElement('div');
  outputControl.className = 'eq-settings-control';
  const outputSlider = document.createElement('input');
  outputSlider.type = 'range';
  outputSlider.className = 'eq-settings-slider';
  outputSlider.min = '0';
  outputSlider.max = '2';
  outputSlider.step = '0.01';
  const outputValue = document.createElement('span');
  outputValue.className = 'eq-settings-value';
  outputValue.textContent = '1.00';
  outputControl.appendChild(outputSlider);
  outputControl.appendChild(outputValue);
  outputRow.appendChild(outputLabel);
  outputRow.appendChild(outputControl);

  // Saturation Mode Row
  const modeRow = document.createElement('div');
  modeRow.className = 'eq-settings-row';
  const modeLabel = document.createElement('span');
  modeLabel.className = 'eq-settings-label';
  modeLabel.textContent = 'Clipping Mode';
  const modeControl = document.createElement('div');
  modeControl.className = 'eq-settings-control';
  const modeSelect = document.createElement('select');
  modeSelect.className = 'eq-settings-select';
  const modes = [
    { value: 'none', label: 'None (Bypass)' },
    { value: 'soft', label: 'Soft Clipping' },
    { value: 'hard', label: 'Hard Clipping' },
    { value: 'foldback', label: 'Foldback' },
    { value: 'limit', label: 'Limiter' }
  ];
  modes.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    modeSelect.appendChild(opt);
  });
  modeControl.appendChild(modeSelect);
  modeRow.appendChild(modeLabel);
  modeRow.appendChild(modeControl);

  // Mono Toggle Row
  const monoRow = document.createElement('div');
  monoRow.className = 'eq-settings-row';
  const monoLabel = document.createElement('span');
  monoLabel.className = 'eq-settings-label';
  monoLabel.textContent = 'Force Mono';
  const monoControl = document.createElement('div');
  monoControl.className = 'eq-settings-control';
  
  const monoSwitchLabel = document.createElement('label');
  monoSwitchLabel.className = 'eq-switch';
  monoSwitchLabel.title = 'Toggle Mono Audio';
  
  const monoInput = document.createElement('input');
  monoInput.type = 'checkbox';
  monoInput.checked = state.isMonoEnabled;
  monoInput.addEventListener('change', (e) => {
    state.setIsMonoEnabled(e.target.checked);
    localStorage.setItem('ytm_eq_mono', JSON.stringify(state.isMonoEnabled));
    // Only apply to audio when EQ is active
    if (state.isEqEnabled && typeof window.__setMonoEnabled === 'function') {
      window.__setMonoEnabled(state.isMonoEnabled);
    }
  });
  
  const monoSlider = document.createElement('span');
  monoSlider.className = 'eq-slider';
  
  monoSwitchLabel.appendChild(monoInput);
  monoSwitchLabel.appendChild(monoSlider);
  monoControl.appendChild(monoSwitchLabel);
  monoRow.appendChild(monoLabel);
  monoRow.appendChild(monoControl);

  // Threshold Row
  const threshRow = document.createElement('div');
  threshRow.className = 'eq-settings-row';
  const threshLabel = document.createElement('span');
  threshLabel.className = 'eq-settings-label';
  threshLabel.textContent = 'Threshold';
  const threshControl = document.createElement('div');
  threshControl.className = 'eq-settings-control';
  const threshSlider = document.createElement('input');
  threshSlider.type = 'range';
  threshSlider.className = 'eq-settings-slider';
  threshSlider.min = '0.1';
  threshSlider.max = '1.0';
  threshSlider.step = '0.01';
  const threshValue = document.createElement('span');
  threshValue.className = 'eq-settings-value';
  threshValue.textContent = '1.00';
  threshControl.appendChild(threshSlider);
  threshControl.appendChild(threshValue);
  threshRow.appendChild(threshLabel);
  threshRow.appendChild(threshControl);

  settingsOverlay.appendChild(outputRow);
  settingsOverlay.appendChild(modeRow);
  settingsOverlay.appendChild(threshRow);
  settingsOverlay.appendChild(monoRow);

  body.appendChild(settingsOverlay);

  const updateSettingsUI = () => {
    if (!state.weq8) return;



    const outGain = state.weq8.outputGain;
    outputSlider.value = outGain;
    outputValue.textContent = outGain.toFixed(2);

    monoInput.checked = state.isMonoEnabled;

    const satMode = state.weq8.saturationMode;
    modeSelect.value = satMode;

    const satThresh = state.weq8.saturationThreshold;
    threshSlider.value = satThresh;
    threshValue.textContent = satThresh.toFixed(2);

    if (satMode === 'none') {
      threshSlider.disabled = true;
      threshValue.style.opacity = '0.4';
    } else {
      threshSlider.disabled = false;
      threshValue.style.opacity = '1';
    }
  };



  settingsBtn.addEventListener('click', () => {
    if (settingsOverlay.classList.contains('show')) {
      settingsOverlay.classList.remove('show');
    } else {
      detectAndConnectVideos();
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }
      updateSettingsUI();
      settingsOverlay.classList.add('show');
    }
  });

  settingsClose.addEventListener('click', () => {
    settingsOverlay.classList.remove('show');
  });

  outputSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    outputValue.textContent = val.toFixed(2);
    localStorage.setItem('ytm_eq_output_gain', val.toString());
    if (state.weq8 && state.isEqEnabled) {
      state.weq8.outputGain = val;
    }
  });

  modeSelect.addEventListener('change', (e) => {
    const mode = e.target.value;
    const threshVal = parseFloat(threshSlider.value);
    localStorage.setItem('ytm_eq_saturation_mode', mode);
    if (state.weq8 && state.isEqEnabled) {
      state.weq8.setSaturationMode(mode, { threshold: threshVal });
    }
    // Always update UI (e.g. disable threshold when mode is 'none')
    updateSettingsUI();
  });

  threshSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    threshValue.textContent = val.toFixed(2);
    localStorage.setItem('ytm_eq_saturation_threshold', val.toString());
    if (state.weq8 && state.isEqEnabled) {
      state.weq8.setSaturationMode(state.weq8.saturationMode, { threshold: val });
    }
  });

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
      detectAndConnectVideos();

      const widget = document.getElementById('eq-widget');
      if (widget && state.weq8 && widget.runtime !== state.weq8) {
        widget.runtime = state.weq8;
      }

      // Resume context (browsers block initial context sometimes)
      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }

      // Force visualizer redraw as the panel slides open and takes physical dimensions
      const forceRedraw = () => {
        if (state.weq8 && state.weq8.emitter) {
          const wasApplying = state.isApplyingPreset;
          state.setIsApplyingPreset(true); // Prevent overriding preset state
          state.weq8.emitter.emit('filtersChanged', state.weq8.spec);
          state.setIsApplyingPreset(wasApplying);
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

  resetBtn.addEventListener('click', () => {
    resetToFlat();
  });

  // Attempt to inject the button in the bottom right player bar controls
  injectButtonLoop(eqButton, expandEqButton);

  // Synchronize controls with loaded state
  updateUIControls();
}

// Look for right-controls-buttons and inject our button there
export function injectButtonLoop(button, expandButton) {
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
      detectAndConnectVideos();
      updateUIControls();
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

// Find and connect all relevant active video elements to the audio graph
export function detectAndConnectVideos() {
  ensureAudioEngine();

  // 1. YouTube main player video
  const ytVideo = document.querySelector('.html5-main-video') ||
                  document.querySelector('#movie_player video') ||
                  document.querySelector('.html5-video-player video');
  if (ytVideo) {
    connectVideo(ytVideo);
  }

  // 2. YouTube Music player bar video
  const ytmVideo = document.querySelector('ytmusic-player-bar video') ||
                   document.querySelector('#player video') ||
                   document.querySelector('ytmusic-player video');
  if (ytmVideo && ytmVideo !== ytVideo) {
    connectVideo(ytmVideo);
  }

  // 3. Fallback: connect all other video elements in the DOM
  const allVideos = document.querySelectorAll('video');
  allVideos.forEach(v => {
    connectVideo(v);
  });

  // Ensure AudioContext is running if any video is actively playing
  if (state.audioCtx && state.audioCtx.state === 'suspended') {
    const isAnyPlaying = Array.from(allVideos).some(v => !v.paused && v.currentTime > 0);
    if (isAnyPlaying) {
      state.audioCtx.resume().catch(() => {});
    }
  }
}

// Watch for DOM mutations to catch video elements if they are hot-swapped
export function setupDOMWatcher() {
  detectAndConnectVideos();

  const observer = new MutationObserver(() => {
    detectAndConnectVideos();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // SPA navigation events for YouTube and YouTube Music
  const spaEvents = [
    'yt-navigate-finish',
    'yt-page-data-updated',
    'ytmusic-navigate-finish',
    'ytmusic-player-bar-attached',
    'ytmusic-player-ready',
    'popstate'
  ];

  spaEvents.forEach(evtName => {
    window.addEventListener(evtName, () => {
      setTimeout(detectAndConnectVideos, 50);
      setTimeout(detectAndConnectVideos, 300);
      setTimeout(detectAndConnectVideos, 1000);
    }, { passive: true });
    document.addEventListener(evtName, () => {
      setTimeout(detectAndConnectVideos, 50);
      setTimeout(detectAndConnectVideos, 300);
      setTimeout(detectAndConnectVideos, 1000);
    }, { passive: true });
  });
}

// ── YouTube (non-music) button injection ──────────────────────────────────────
// Finds .ytp-settings-button, gets its parentElement (works for both the old
// .ytp-right-controls layout and the new .ytp-right-controls-left layout),
// and inserts the KEQ button directly before it.
// A MutationObserver watches the player so the button is re-injected after
// YouTube rebuilds controls (navigation, fullscreen, video change, etc.)
export function injectYouTubeButton() {
  // Build the button once and reuse it
  const ytBtn = document.createElement('button');
  ytBtn.id = 'ytm-eq-btn';
  ytBtn.className = 'ytp-button';
  ytBtn.title = 'Equalizer (KEQ)';
  ytBtn.setAttribute('data-priority', '6');
  ytBtn.setAttribute('aria-haspopup', 'true');
  ytBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;';

  // Same EQ SVG icon used in the YTM toolbar
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.style.cssText = 'width:24px;height:24px;flex-shrink:0;display:block;pointer-events:none;';
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  [
    { x1: 4, y1: 21, x2: 4, y2: 14 },
    { x1: 4, y1: 10, x2: 4, y2: 3 },
    { x1: 12, y1: 21, x2: 12, y2: 12 },
    { x1: 12, y1: 8, x2: 12, y2: 3 },
    { x1: 20, y1: 21, x2: 20, y2: 16 },
    { x1: 20, y1: 12, x2: 20, y2: 3 }
  ].forEach(l => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', l.x1); line.setAttribute('y1', l.y1);
    line.setAttribute('x2', l.x2); line.setAttribute('y2', l.y2);
    svg.appendChild(line);
  });

  [
    { cx: 4, cy: 12, r: 2 },
    { cx: 12, cy: 10, r: 2 },
    { cx: 20, cy: 14, r: 2 }
  ].forEach(c => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', c.cx); circle.setAttribute('cy', c.cy);
    circle.setAttribute('r', c.r);
    circle.setAttribute('fill', 'currentColor');
    svg.appendChild(circle);
  });

  ytBtn.appendChild(svg);

  // Toggle the shared EQ panel on click, positioned dynamically above the player's right edge
  ytBtn.addEventListener('click', () => {
    const panel = document.getElementById('ytm-eq-panel');
    if (!panel) return;

    const isShowing = panel.classList.contains('show');
    if (isShowing) {
      panel.classList.remove('show');

      // Clean up inline position after the fade-out transition finishes
      panel.addEventListener('transitionend', () => {
        panel.style.top = '';
        panel.style.bottom = '';
        panel.style.right = '';
      }, { once: true });
    } else {
      // --- Position calculation ---
      // We want the panel to be glued to the document (not the viewport) so it scrolls away
      // with the page. We use 'absolute' positioning on the body.
      panel.style.position = 'absolute';

      const btnRect = ytBtn.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Calculate top so it sits just above the button
      // To get the height, we might need to do a quick layout calc if it's hidden.
      // 500px is a safe fallback height for the panel.
      const panelHeight = panel.offsetHeight > 50 ? panel.offsetHeight : 500;
      const top = btnRect.top + scrollY - panelHeight - 10;

      // Horizontal: right edge of panel aligned 24px inside the player's right edge
      const player = document.querySelector('.html5-video-player');
      const playerRect = player ? player.getBoundingClientRect() : null;
      const right = playerRect
        ? Math.max(0, window.innerWidth - playerRect.right) + 24
        : 24;

      // --- Set position instantly, then animate opacity/transform only ---
      panel.style.transition = 'none';
      panel.style.bottom = 'auto'; // override default CSS bottom
      panel.style.top = top + 'px';
      panel.style.right = right + 'px';
      // Force reflow
      panel.getBoundingClientRect();
      panel.style.transition = '';

      panel.classList.add('show');

      // Connect audio graph on first open
      detectAndConnectVideos();

      const widget = document.getElementById('eq-widget');
      if (widget && state.weq8 && widget.runtime !== state.weq8) {
        widget.runtime = state.weq8;
      }

      if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume().catch(() => {});
      }

      // Force visualizer redraw as the panel slides open
      const forceRedraw = () => {
        if (state.weq8 && state.weq8.emitter) {
          const wasApplying = state.isApplyingPreset;
          state.setIsApplyingPreset(true); // Prevent overriding preset state
          state.weq8.emitter.emit('filtersChanged', state.weq8.spec);
          state.setIsApplyingPreset(wasApplying);
        }
      };
      setTimeout(forceRedraw, 50);
      setTimeout(forceRedraw, 150);
      setTimeout(forceRedraw, 350);
    }
  });

  // Recalculate panel position when layout changes (fullscreen, resize, theater mode)
  const repositionPanel = () => {
    const panel = document.getElementById('ytm-eq-panel');
    if (!panel || !panel.classList.contains('show')) return;

    panel.style.position = 'absolute';
    const btnRect = ytBtn.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const panelHeight = panel.offsetHeight > 50 ? panel.offsetHeight : 500;
    const top = btnRect.top + scrollY - panelHeight - 10;

    const player = document.querySelector('.html5-video-player');
    const playerRect = player ? player.getBoundingClientRect() : null;
    const right = playerRect
      ? Math.max(0, window.innerWidth - playerRect.right) + 24
      : 24;

    panel.style.transition = 'none';
    panel.style.bottom = 'auto';
    panel.style.top = top + 'px';
    panel.style.right = right + 'px';
    panel.getBoundingClientRect();
    panel.style.transition = '';
  };

  document.addEventListener('fullscreenchange', () => setTimeout(repositionPanel, 150));
  window.addEventListener('resize', repositionPanel);

  // Attempt to place the button before .ytp-settings-button in the player
  const tryInject = () => {
    if (document.getElementById('ytm-eq-btn')) return true; // Already there

    const player = document.querySelector('.html5-video-player');
    if (!player) return false;

    const settingsBtn = player.querySelector('.ytp-settings-button');
    if (!settingsBtn) return false;

    settingsBtn.parentElement.insertBefore(ytBtn, settingsBtn);
    log.info('Equalizer button injected into YouTube player controls.');

    // Initialize audio graph silently on first injection (after button is in DOM so it can be colored)
    detectAndConnectVideos();
    updateUIControls();

    return true;
  };

  // Watch for player rebuilds (navigation, fullscreen, video changes)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('ytm-eq-btn')) {
      tryInject();
    }
  });

  const startObserver = () => {
    const player = document.querySelector('.html5-video-player');
    if (player) {
      observer.observe(player, { childList: true, subtree: true });
    } else {
      // Player not yet in DOM — watch body until it appears
      const bodyObserver = new MutationObserver(() => {
        const p = document.querySelector('.html5-video-player');
        if (p) {
          bodyObserver.disconnect();
          observer.observe(p, { childList: true, subtree: true });
          tryInject();
        }
      });
      bodyObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  };

  if (!tryInject()) {
    startObserver();
  } else {
    startObserver(); // Still watch for future rebuilds even if first inject succeeded
  }

  // Also try re-injecting and detecting videos on YouTube navigation events
  ['yt-navigate-finish', 'yt-page-data-updated'].forEach(evt => {
    window.addEventListener(evt, () => {
      setTimeout(tryInject, 100);
      setTimeout(tryInject, 500);
      setTimeout(detectAndConnectVideos, 100);
      setTimeout(detectAndConnectVideos, 500);
    }, { passive: true });
  });
}
