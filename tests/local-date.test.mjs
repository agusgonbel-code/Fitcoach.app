import assert from 'node:assert/strict';

await import('../local-date-v345.js');
const { localDateKey } = globalThis.FitCoachLocalDate;
const originalTimezone = process.env.TZ;

try {
  process.env.TZ = 'Pacific/Kiritimati';
  const eastOfUtcMidnight = new Date('2026-08-12T10:15:00.000Z');
  assert.equal(eastOfUtcMidnight.toISOString().slice(0, 10), '2026-08-12');
  assert.equal(localDateKey(eastOfUtcMidnight), '2026-08-13');

  process.env.TZ = 'America/Los_Angeles';
  const westOfUtcMidnight = new Date('2026-08-13T06:30:00.000Z');
  assert.equal(westOfUtcMidnight.toISOString().slice(0, 10), '2026-08-13');
  assert.equal(localDateKey(westOfUtcMidnight), '2026-08-12');

  assert.equal(localDateKey(new Date(2024, 1, 29, 12, 0)), '2024-02-29');
  assert.throws(() => localDateKey(new Date(Number.NaN)), /Fecha local no válida/);
} finally {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
}

console.log('Local date tests passed');
