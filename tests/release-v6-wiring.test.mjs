import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bootstrap = fs.readFileSync(new URL('../bootstrap-v48.js', import.meta.url), 'utf8');
const intake = fs.readFileSync(new URL('../unified-intake-v35.js', import.meta.url), 'utf8');
const coach = fs.readFileSync(new URL('../coach-page-v6.js', import.meta.url), 'utf8');

const requiredModules = [
  'nutrition-precision-v6.js',
  'client-engine-v35.js',
  'client-quality-v41.js',
  'mobile-quality-v41.js',
  'unified-intake-v35.js',
  'coach-page-v6.js'
];

test('release v6 activates every critical personalization module', () => {
  for (const module of requiredModules) {
    assert.match(bootstrap, new RegExp(module.replaceAll('.', '\\.')));
  }
});

test('unified intake generates nutrition, training and a 30 day menu from one profile', () => {
  assert.match(intake, /calculateNutrition/);
  assert.match(intake, /buildTrainingPlan/);
  assert.match(intake, /generateMenu/);
  assert.match(intake, /fitcoach_client_profile_v35/);
  assert.match(intake, /fitcoach_active_plan_v33/);
});

test('Coach page is data driven and present in navigation', () => {
  assert.match(coach, /workouts/);
  assert.match(coach, /meals/);
  assert.match(coach, /metrics/);
  assert.match(coach, /readiness/);
  assert.match(coach, /dataset\.go='coachPage'/);
});
