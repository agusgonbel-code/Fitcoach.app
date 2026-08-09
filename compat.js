// FitCoach runtime compatibility shim
window.CROSS_WODS = Array.isArray(window.CROSS_WODS) ? window.CROSS_WODS : [];
window.FITCOACH_RUNTIME = Object.assign({}, window.FITCOACH_RUNTIME, {
  crossModuleDetached: true,
  compatibilityShim: true,
  build: '2026-08-09-pro-pack'
});
