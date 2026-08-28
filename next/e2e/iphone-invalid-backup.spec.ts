import { expect, test } from '@playwright/test';

test('invalid backup is rejected on iPhone before destructive confirmation and preserves Next plus legacy data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'backup-safe-user',
      name: 'Safe QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 46,
      heightCm: 181,
      weightKg: 75,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 4,
      sessionMinutes: 50,
      preferredTrainingDays: [0, 1, 2, 3],
      equipment: ['gym'],
      restrictions: [],
    }));
    localStorage.setItem('fitcoach_next_sessions_v1', '[{"id":"safe-session"}]');
    localStorage.setItem('fitcoach_next_food_log_v1', '[{"id":"safe-food"}]');
    localStorage.setItem('fitcoach_next_body_metrics_v1', '[]');
    localStorage.setItem('fitcoach_client_profile_v35', '{"name":"Legacy must survive"}');
    localStorage.setItem('workouts', '[{"legacy":true}]');
  });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Safe QA' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Copia completa' })).toBeVisible();

  let dialogCount = 0;
  page.on('dialog', async dialog => {
    dialogCount += 1;
    await dialog.dismiss();
  });

  await page.getByLabel('Seleccionar copia de FitCoach Next').setInputFiles({
    name: 'invalid-fitcoach-next-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      schema: 'fitcoach-next-complete-backup',
      version: 999,
      exportedAt: '2026-08-28T12:00:00.000Z',
      core: null,
      nutritionPlan: null,
      progressPhotos: [],
    })),
  });

  await expect(page.getByRole('status')).toContainText('La copia completa no es compatible con esta versión de FitCoach Next.');
  expect(dialogCount).toBe(0);

  const preserved = await page.evaluate(() => ({
    profile: localStorage.getItem('fitcoach_next_profile_v1'),
    sessions: localStorage.getItem('fitcoach_next_sessions_v1'),
    foodLog: localStorage.getItem('fitcoach_next_food_log_v1'),
    legacyProfile: localStorage.getItem('fitcoach_client_profile_v35'),
    legacyWorkouts: localStorage.getItem('workouts'),
  }));

  expect(JSON.parse(preserved.profile || 'null').name).toBe('Safe QA');
  expect(preserved.sessions).toBe('[{"id":"safe-session"}]');
  expect(preserved.foodLog).toBe('[{"id":"safe-food"}]');
  expect(preserved.legacyProfile).toBe('{"name":"Legacy must survive"}');
  expect(preserved.legacyWorkouts).toBe('[{"legacy":true}]');
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).resolves.toBe(true);
});
