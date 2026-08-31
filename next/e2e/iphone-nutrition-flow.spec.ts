import { expect, test } from '@playwright/test';

async function prepareProfile(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fitcoach_next_')) localStorage.removeItem(key);
    }
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'nutrition-rc-profile',
      name: 'Nutrition QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 40,
      heightCm: 180,
      weightKg: 80,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 4,
      sessionMinutes: 50,
      preferredTrainingDays: [0, 1, 3, 4],
      equipment: ['gym'],
      restrictions: [],
    }));
  });
}

test('iPhone RC keeps nutrition plan, swap and food logging coherent through relaunch', async ({ page }) => {
  await page.goto('/');
  await prepareProfile(page);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Nutrition QA' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu estrategia' })).toBeVisible();

  await page.getByRole('button', { name: '30 días', exact: true }).click();
  const days = page.locator('[aria-label="Seleccionar día del plan"] button');
  await expect(days).toHaveCount(30);
  await days.nth(9).click();
  await expect(page.getByRole('heading', { name: 'Día 10' })).toBeVisible();

  const firstMeal = page.locator('.planned-meal').first();
  const originalName = (await firstMeal.locator('strong').first().textContent())?.replace(/^1\.\s*/, '') ?? '';
  expect(originalName.length).toBeGreaterThan(0);

  await firstMeal.getByText('Receta completa', { exact: true }).click();
  await expect(firstMeal.locator('.ingredient-row').first()).toBeVisible();
  await expect(firstMeal.locator('.ingredient-row strong').first()).toContainText('g');

  await firstMeal.getByRole('button', { name: 'Sustituir', exact: true }).click();
  const swappedName = (await firstMeal.locator('strong').first().textContent())?.replace(/^1\.\s*/, '') ?? '';
  expect(swappedName).not.toBe(originalName);
  expect(swappedName.length).toBeGreaterThan(0);

  await firstMeal.getByRole('button', { name: 'Registrar hoy', exact: true }).click();
  await expect(page.getByRole('heading', { name: swappedName })).toBeVisible();

  const persisted = await page.evaluate(() => ({
    food: JSON.parse(localStorage.getItem('fitcoach_next_food_log_v1') || '[]'),
    plan: JSON.parse(localStorage.getItem('fitcoach_next_nutrition_plan_v1') || 'null'),
  }));
  expect(persisted.food).toHaveLength(1);
  expect(persisted.food[0].name).toBe(swappedName);
  expect(persisted.food[0].kcal).toBeGreaterThan(0);
  expect(persisted.food[0].proteinG).toBeGreaterThan(0);
  expect(persisted.plan?.horizon).toBe('month');
  expect(persisted.plan?.selectedDay).toBe(10);
  expect(Object.keys(persisted.plan?.overrides ?? {})).toContain('month-10-0');

  await nav.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.getByText(`${Math.round(persisted.food[0].kcal)} /`, { exact: false })).toBeVisible();

  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Nutrition QA' })).toBeVisible();

  const relaunchedNav = page.getByRole('navigation', { name: 'Navegación principal' });
  await relaunchedNav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByRole('button', { name: '30 días', exact: true })).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'Día 10' })).toBeVisible();
  await expect(page.locator('.planned-meal').first().locator('strong').first()).toContainText(swappedName);
  await expect(page.getByRole('heading', { name: swappedName })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
