// FitCoach 2.3.1 bootstrap compatibility
// Crosstraining lives in CrossCoach; FitCoach must not fail if CROSS_WODS is absent.
window.CROSS_WODS = Array.isArray(window.CROSS_WODS) ? window.CROSS_WODS : [];
window.FITCOACH_RUNTIME = Object.assign({}, window.FITCOACH_RUNTIME, {
  runtime: '2.3.1',
  crossCoachDetached: true,
  repairedAt: new Date().toISOString()
});
