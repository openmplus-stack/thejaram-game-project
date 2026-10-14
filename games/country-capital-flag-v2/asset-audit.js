/* Read-only visual-asset audit. No gameplay or screen layout changes. */
(() => {
  'use strict';
  const assets = Object.freeze({
    explorer: '../country-capital-flag/assets/characters/explorer-master.png',
    title: './assets/ui-title-sign.png',
    footer: './assets/ui-bottom-navigation.png',
    background: './assets/bg-world-clean.png',
    topicReference: './assets/screen-topic-select.jpg'
  });
  const results = {};
  function inspect(name, src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        results[name] = {ok: true, width: img.naturalWidth, height: img.naturalHeight, src};
        resolve(results[name]);
      };
      img.onerror = () => {
        results[name] = {ok: false, src};
        console.warn('[country-v2] Visual reference asset failed to load:', name, src);
        resolve(results[name]);
      };
      img.src = src;
    });
  }
  const ready = Promise.all(Object.entries(assets).map(([name, src]) => inspect(name, src)))
    .then(() => Object.freeze({...results}));
  window.CountryV2VisualAudit = Object.freeze({assets, ready});
})();
