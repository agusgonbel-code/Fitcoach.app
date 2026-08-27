import { expect, test } from '@playwright/test';

test('privacy deletion removes FitCoach Next data but preserves legacy 3.4.4 data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'privacy-qa-user',
      name: 'Privacy QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 40,
      heightCm: 180,
      weightKg: 80,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 3,
      sessionMinutes: 50,
      preferredTrainingDays: [0, 2, 4],
      equipment: ['gym'],
      restrictions: [],
    }));
    localStorage.setItem('fitcoach_next_sessions_v1', '[]');
    localStorage.setItem('fitcoach_next_workout_draft_v1', '{"draft":true}');
    localStorage.setItem('fitcoach_next_legacy_data_migration_v1', 'done');
    localStorage.setItem('fitcoach_client_profile_v35', '{"name":"Legacy preserved"}');
    localStorage.setItem('workouts', '[{"legacy":true}]');
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Privacy QA' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Copia completa' })).toBeVisible();

  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Borrar todos mis datos' }).click();
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toBeVisible();
  const data = await page.evaluate(() => ({
    profile: localStorage.getItem('fitcoach_next_profile_v1'),
    sessions: localStorage.getItem('fitcoach_next_sessions_v1'),
    draft: localStorage.getItem('fitcoach_next_workout_draft_v1'),
    migration: localStorage.getItem('fitcoach_next_legacy_data_migration_v1'),
    legacyProfile: localStorage.getItem('fitcoach_client_profile_v35'),
    legacyWorkouts: localStorage.getItem('workouts'),
  }));

  expect(data.profile).toBeNull();
  expect(data.sessions).toBeNull();
  expect(data.draft).toBeNull();
  expect(data.migration).toBeNull();
  expect(data.legacyProfile).toBe('{"name":"Legacy preserved"}');
  expect(data.legacyWorkouts).toBe('[{"legacy":true}]');
});
