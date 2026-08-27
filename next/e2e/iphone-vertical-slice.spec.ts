import { expect, test } from '@playwright/test';

test('onboarding, primary navigation and mobile layout work on iPhone', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toBeVisible();
  await page.getByLabel('Nombre').fill('QA iPhone');
  await page.getByRole('button', { name: 'Crear mi plan' }).click();

  await expect(page.getByRole('heading', { name: 'Hola, QA iPhone' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav).toBeVisible();
  for (const label of ['Hoy', 'Entrenar', 'Nutrición', 'Progreso', 'Perfil']) {
    const button = nav.getByRole('button', { name: label, exact: true });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }

  await nav.getByRole('button', { name: 'Entrenar', exact: true }).click();
  await expect(page.getByText(/ENTRENAMIENTO|PLAN SEMANAL/).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByText(/NUTRICIÓN/).first()).toBeVisible();

  await nav.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();

  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'QA iPhone' })).toBeVisible();
});

test('profile and preferred training days survive a mobile reload after onboarding', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nombre').fill('Persistencia QA');
  await page.getByRole('button', { name: 'Crear mi plan' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Persistencia QA' })).toBeVisible();

  const daysBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || '{}').preferredTrainingDays);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Persistencia QA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toHaveCount(0);
  const daysAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || '{}').preferredTrainingDays);
  expect(daysAfterReload).toEqual(daysBeforeReload);
});

test('active workout draft recovers on iPhone, saves once and appears in Progress', async ({ page }) => {
  await page.addInitScript(() => {
    const today = (new Date().getDay() + 6) % 7;
    const secondDay = (today + 3) % 7;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-workout-user',
      name: 'Workout QA',
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
  await expect(page.getByRole('heading', { name: 'Hola, Workout QA' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar entrenamiento' }).click();
  await expect(page.getByText('ENTRENAMIENTO ACTIVO')).toBeVisible();

  const firstExercise = page.locator('.exercise-card').first();
  await firstExercise.getByPlaceholder('kg').first().fill('80');
  await firstExercise.getByPlaceholder('reps').first().fill('10');
  await firstExercise.getByPlaceholder('RIR').first().fill('0');
  await firstExercise.getByRole('button', { name: /Completar serie 1 de/ }).click();
  await expect(page.getByText('DESCANSO', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('Sesión recuperada')).toBeVisible();
  const recoveredExercise = page.locator('.exercise-card').first();
  await expect(recoveredExercise.getByPlaceholder('kg').first()).toHaveValue('80');
  await expect(recoveredExercise.getByPlaceholder('reps').first()).toHaveValue('10');
  await expect(recoveredExercise.getByPlaceholder('RIR').first()).toHaveValue('0');

  await page.getByRole('button', { name: 'Finalizar y guardar' }).click();
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();
  await expect(page.locator('.metric-card').filter({ hasText: 'series' }).locator('strong')).toHaveText('1');
  await expect(page.locator('.metric-card').filter({ hasText: 'kg × reps' }).locator('strong')).toHaveText('800');

  const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]'));
  expect(sessions).toHaveLength(1);
  expect(sessions[0].exercises[0].sets[0]).toMatchObject({ kg: 80, reps: 10, rir: 0 });
  expect(await page.evaluate(() => localStorage.getItem('fitcoach_next_workout_draft_v1'))).toBeNull();
});
