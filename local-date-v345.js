(function () {
  'use strict';

  function localDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) throw new TypeError('Fecha local no válida');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  globalThis.FitCoachLocalDate = { localDateKey };

  // Carga secuencial del nuevo motor unificado sin acoplarlo al bundle legado.
  if (typeof document !== 'undefined') {
    const load = src => new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-fc-v35="${src}"]`)) return resolve();
      const script = document.createElement('script');
      script.src = src; script.dataset.fcV35 = src;
      script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
    load('client-engine-v35.js').then(() => load('unified-intake-v35.js')).catch(() => {});
  }
})();
