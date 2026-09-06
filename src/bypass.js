console.log('%c[KEQ] Initializing deep custom elements ES5 adapter bypass...', 'background: #ff0055; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;');

try {
  // 1. Save the original adapter-wrapped constructors
  const adapterHTMLElement = window.HTMLElement;
  const adapterDefine = window.customElements && window.customElements.define;

  // 2. Create a permanent hidden sandbox iframe to extract the native, clean define method
  let iframe = document.getElementById('keq-sandbox-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'keq-sandbox-iframe';
    iframe.style.display = 'none';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    (document.body || document.documentElement).appendChild(iframe);
  }

  const iframeWin = iframe.contentWindow;
  const nativeDefine = iframeWin && (
    (iframeWin.customElements && iframeWin.customElements.define) ||
    (iframeWin.CustomElementRegistry && iframeWin.CustomElementRegistry.prototype && iframeWin.CustomElementRegistry.prototype.define)
  );

  // 3. Extract the original, native HTMLElement constructor of the MAIN window using a prototype-chain hack!
  // Object.getPrototypeOf(HTMLDivElement) bypasses the ES5 adapter's override while remaining in the main window context.
  const nativeHTMLElement = Object.getPrototypeOf(window.HTMLDivElement) ||
    (window.HTMLDivElement && window.HTMLDivElement.prototype && Object.getPrototypeOf(window.HTMLDivElement.prototype).constructor) ||
    window.HTMLElement;

  if (nativeDefine && nativeHTMLElement && window.customElements) {
    // 4. Temporarily set window.HTMLElement to the native main-window constructor for the import phase
    window.HTMLElement = nativeHTMLElement;

    window.customElements.define = function (name, constructor, options) {
      if (window.customElements.get(name)) {
        return;
      }
      if (name.startsWith('weq8-') || name === 'weq8-ui' || name === 'weq8-ui-filter-row' || name === 'weq8-ui-filter-hud') {
        console.log(`%c[KEQ]%c Registered native ES6 component bypassing adapter: ${name}`, 'background: #ff0055; color: white; padding: 2px 6px; border-radius: 4px;', 'color: #00f2fe; font-weight: bold;');
        return nativeDefine.call(window.customElements, name, constructor, options);
      }
      if (adapterDefine) {
        return adapterDefine.call(window.customElements, name, constructor, options);
      }
      return nativeDefine.call(window.customElements, name, constructor, options);
    };

    // 5. Define a restore function to bring back the adapter environment right after imports complete.
    //    This is called on BOTH YouTube Music and regular YouTube — without restoring, the patched
    //    HTMLElement and customElements.define stay active for the whole page, breaking other elements.
    window.__keq_restore_bypass = function () {
      window.HTMLElement = adapterHTMLElement;
      if (adapterDefine) {
        window.customElements.define = adapterDefine;
      }
      delete window.__keq_restore_bypass;
      console.log('%c[KEQ]%c Restored adapter environment.', 'background: #ff0055; color: white; padding: 2px 6px; border-radius: 4px;', 'color: #888;');
    };
  } else {
    console.warn('[KEQ] Could not retrieve native browser constructors. Adapter bypass disabled.');
  }
} catch (err) {
  console.error('[KEQ] Failed to setup deep custom elements adapter bypass:', err);
}
