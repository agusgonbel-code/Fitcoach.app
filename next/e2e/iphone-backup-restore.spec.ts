import { expect, test } from '@playwright/test';

test('complete backup restores FitCoach Next state on iPhone without touching legacy 3.4.4 data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'backup-current-user',
      name: 'Current QA',
      goal: 'strength',
      experience: 'intermediate',
      sex: 'male',
      age: 42,
      heightCm: 181,
      weightKg: 82,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 3,
      sessionMinutes: 50,
      preferredTrainingDays: [0, 2, 4],
      equipment: ['gym'],
      restrictions: [],
    }));
    localStorage.setItem('fitcoach_next_sessions_v1', '[]');
    localStorage.setItem('fitcoach_next_food_log_v1', '[]');
    localStorage.setItem('fitcoach_next_body_metrics_v1', '[]');
    localStorage.setItem('fitcoach_client_profile_v35', '{"name":"Legacy must survive"}');
    localStorage.setItem('workouts', '[{"legacy":true}]');
  });
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Current QA' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Copia completa' })).toBeVisible();

  const backup = {
    schema: 'fitcoach-next-complete-backup',
    version: 1,
    exportedAt: '2026-08-28T09:00:00.000Z',
    core: {
      schema: 'fitcoach-next-backup',
      version: 1,
      exportedAt: '2026-08-28T09:00:00.000Z',
      data: {
        profile: {
          id: 'backup-restored-user',
          name: 'Restored QA',
          goal: 'recomp',
          experience: 'advanced',
          sex: 'male',
          age: 46,
          heightCm: 181,
          weightKg: 75,
          activityMultiplier: 1.55,
          trainingDaysPerWeek: 4,
          sessionMinutes: 50,
          preferredTrainingDays: [0, 1, 2, 3],
          equipment: ['gym'],
          restrictions: [],
        },
        sessions: [],
        foodLog: [],
        bodyMetrics: [{
          id: 'metric-restored',
          date: '2026-08-28',
          weightKg: 75,
          waistCm: 82,
        }],
      },
    },
    nutritionPlan: null,
    progressPhotos: [],
  };

  page.once('dialog', dialog => void dialog.accept());
  await page.getByLabel('Seleccionar copia de FitCoach Next').setInputFiles({
    name: 'fitcoach-next-complete-v1-2026-08-28.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByRole('heading', { name: 'Hola, Restored QA' })).toBeVisible();
  const restored = await page.evaluate(() => ({
    profile: JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || 'null'),
    bodyMetrics: JSON.parse(localStorage.getItem('fitcoach_next_body_metrics_v1') || '[]'),
    legacyProfile: localStorage.getItem('fitcoach_client_profile_v35'),
    legacyWorkouts: localStorage.getItem('workouts'),
  }));

  expect(restored.profile.name).toBe('Restored QA');
  expect(restored.profile.goal).toBe('recomp');
  expect(restored.bodyMetrics).toEqual([{ id: 'metric-restored', date: '2026-08-28', weightKg: 75, waistCm: 82 }]);
  expect(restored.legacyProfile).toBe('{"name":"Legacy must survive"}');
  expect(restored.legacyWorkouts).toBe('[{"legacy":true}]');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Restored QA' })).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).resolves.toBe(true);
});
