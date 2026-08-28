import { expect, test } from '@playwright/test';

async function seedProfile(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fitcoach_next_')) localStorage.removeItem(key);
    }

    const today = (new Date().getDay() + 6) % 7;
    const secondDay = (today + 3) % 7;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-coach-adaptation-user',
      name: 'Coach QA',
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
}

test('iPhone RC requires confirmation and persists Coach adaptation for the next microcycle only', async ({ page }) => {
  await page.goto('/');
  await seedProfile(page);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Coach QA' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Progreso', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'FitCoach propone: Reducir volumen' })).toBeVisible();
  await expect(page.getByText('-10% volumen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar cambio' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mantener plan' })).toBeVisible();

  expect(await page.evaluate(() => localStorage.getItem('fitcoach_next_training_adaptation_v1'))).toBeNull();

  await page.getByRole('button', { name: 'Aceptar cambio' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cambio aceptado' })).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_training_adaptation_v1') || 'null'));
  expect(stored).toMatchObject({
    version: 2,
    status: 'accepted',
    proposal: {
      id: 'adapt-adherence',
      action: 'reduce-volume',
      volumePercent: -10,
      loadPercent: 0,
      requiresConfirmation: true,
    },
  });
  expect(stored.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(stored.effectiveUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(stored.effectiveFrom < stored.effectiveUntil).toBeTruthy();

  // Accepted adaptations must never alter the current microcycle. The Today card
  // only exposes "Plan adaptado" while the accepted decision is actually active.
  await nav.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.getByText('Plan adaptado')).toHaveCount(0);

  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Coach QA' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cambio aceptado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar cambio' })).toHaveCount(0);

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('fitcoach_next_training_adaptation_v1') || 'null'));
  expect(persisted).toEqual(stored);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
