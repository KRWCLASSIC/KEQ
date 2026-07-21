// Styles for the Equalizer UI Panel and Button
export const PANEL_STYLES = `
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
    transition: background-color .3s, border-color .3s;
    border-radius: 34px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    padding: 0 4px;
    box-sizing: border-box;
  }
  
  .eq-slider:before {
    content: "";
    display: block;
    flex-shrink: 0;
    height: 14px;
    width: 14px;
    background-color: #aaa;
    transition: margin-left .3s, background-color .3s;
    border-radius: 50%;
    margin-left: 0;
  }
  
  .eq-switch input:checked + .eq-slider {
    background-color: rgba(255, 204, 0, 0.2);
    border-color: rgba(255, 204, 0, 0.4);
  }
  
  .eq-switch input:checked + .eq-slider:before {
    margin-left: 22px;
    background-color: #ffcc00;
  }
  
  /* Custom Dropdown styling */
  .eq-custom-select-container {
    position: relative;
    user-select: none;
  }

  .eq-select-current {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #eee;
    padding: 5px 28px 5px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;
    min-width: 100px;
  }

  .eq-select-current:hover {
    background-color: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .eq-custom-select-container.open .eq-select-current {
    border-color: #ffcc00;
  }

  .eq-select-menu-wrap {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px 0;
    min-width: 180px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: none;
    max-height: 300px;
  }

  .eq-custom-select-container.open .eq-select-menu-wrap {
    display: flex;
  }

  .eq-select-menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .eq-select-menu::-webkit-scrollbar {
    display: none;
  }

  /* Custom DOM Scrollbar */
  .eq-custom-scrollbar {
    position: absolute;
    top: 8px;
    right: 4px;
    width: 4px;
    bottom: 8px;
    z-index: 1001;
    display: none;
    background: transparent;
  }
  .eq-select-menu-wrap .eq-custom-scrollbar.visible {
    display: block;
  }

  .eq-custom-scrollbar-thumb {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    cursor: pointer;
  }
  .eq-custom-scrollbar-thumb:hover, .eq-custom-scrollbar-thumb.dragging {
    background: rgba(255, 255, 255, 0.4);
  }

  .eq-custom-select-container.open .eq-select-menu {
    display: flex;
  }

  .eq-select-group {
    padding: 4px 12px;
    font-size: 9px;
    text-transform: uppercase;
    color: #888;
    letter-spacing: 0.5px;
    font-weight: 700;
    margin-top: 4px;
  }
  .eq-select-group:first-child { margin-top: 0; }

  .eq-select-option {
    padding: 6px 12px;
    font-size: 11px;
    color: #eee;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .eq-select-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .eq-select-option.active {
    color: #ffcc00;
  }

  .eq-preset-delete {
    opacity: 0.3;
    font-size: 16px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-right: 4px;
    line-height: 1;
    flex-shrink: 0;
  }
  .eq-preset-delete:hover {
    opacity: 1;
    color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }

  .eq-select-actions {
    margin-bottom: 4px;
    padding: 4px 12px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    gap: 6px;
  }

  #eq-new-preset-name {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 4px 8px;
    color: white;
    font-size: 11px;
    outline: none;
    min-width: 0;
  }
  #eq-new-preset-name:focus {
    border-color: rgba(255, 255, 255, 0.3);
  }

  #eq-save-preset-btn {
    background: rgba(255, 204, 0, 0.15);
    color: #ffcc00;
    border: 1px solid rgba(255, 204, 0, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
    font-weight: 600;
  }
  #eq-save-preset-btn:hover {
    background: rgba(255, 204, 0, 0.25);
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
    position: relative;
  }

  /* Settings overlay styling */
  .eq-settings-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(15px) saturate(140%);
    -webkit-backdrop-filter: blur(15px) saturate(140%);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85);
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .eq-settings-overlay.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }

  .eq-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 8px;
    margin-bottom: 4px;
    flex-shrink: 0;
  }

  .eq-settings-title {
    font-size: 13px;
    font-weight: 600;
    color: #ffcc00;
  }

  .eq-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex: 1;
  }

  .eq-settings-label {
    font-size: 11px;
    color: #ddd;
    font-weight: 500;
    width: 120px;
    flex-shrink: 0;
  }

  .eq-settings-control {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-grow: 1;
    justify-content: flex-end;
  }

  .eq-settings-slider {
    flex-grow: 1;
    max-width: 180px;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.15);
    outline: none;
    cursor: pointer;
  }

  .eq-settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffcc00;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(255, 204, 0, 0.5);
    transition: transform 0.1s;
  }

  .eq-settings-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .eq-settings-slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .eq-settings-slider:disabled::-webkit-slider-thumb {
    background: #888;
    box-shadow: none;
    cursor: not-allowed;
  }

  .eq-settings-value {
    font-size: 11px;
    font-family: monospace;
    color: #bbb;
    width: 45px;
    text-align: right;
  }

  .eq-settings-select {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #eee;
    padding: 4px 24px 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 10px;
    width: 160px;
  }

  .eq-settings-select:focus {
    border-color: #ffcc00;
  }

  .eq-settings-select option {
    background: #181818;
    color: #eee;
  }
`;
