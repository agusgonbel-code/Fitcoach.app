import { expect, test } from '@playwright/test';

test('essential iPhone flow remains usable after connectivity is lost', async ({ page, context }) => {
  await page.addInitScript(() => {
    const today = (new Date().getDay() + 6) % 7;
    const secondDay = (today + 3) % 7;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-offline-user',
      name: 'Offline QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 40,
      heightCm: 180,
      weightKg: 80,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 2,
      sessionMinutes: 50,
      preferredTrainingDays: [today, secondDay],
      equipment: ['gym'],
      restrictions: [],
    }));
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Offline QA' })).toBeVisible();

  // Native FitCoach Next ships its web bundle inside the app. Once launched, the
  // essential local-first flows must not depend on connectivity.
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click();
  await expect(page.getByText('ENTRENAMIENTO ACTIVO')).toBeVisible();

  const firstExercise = page.locator('.exercise-card').first();
  await firstExercise.getByPlaceholder('kg').first().fill('72.5');
  await firstExercise.getByPlaceholder('reps').first().fill('9');
  await firstExercise.getByPlaceholder('RIR').first().fill('1');
  await firstExercise.getByRole('button', { name: /Completar serie 1 de/ }).click();
  await expect(page.getByText('DESCANSO', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Finalizar y guardar' }).click();
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();
  await expect(page.locator('.metric-card').filter({ hasText: 'series' }).locator('strong')).toHaveText('1');
  // Progress intentionally presents whole-number volume while persisted set data
  // retains decimal load precision.
  await expect(page.locator('.metric-card').filter({ hasText: 'kg × reps' }).locator('strong')).toHaveText('653');

  const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]'));
  expect(sessions).toHaveLength(1);
  expect(sessions[0].exercises[0].sets[0]).toMatchObject({ kg: 72.5, reps: 9, rir: 1 });

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByText('NUTRICIÓN').first()).toBeVisible();

  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Offline QA' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
