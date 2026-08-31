import { expect, test } from '@playwright/test';

async function seedCorruptActivity(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fitcoach_next_')) localStorage.removeItem(key);
    }

    const today = (new Date().getDay() + 6) % 7;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-corrupt-activity-user',
      name: 'Recovery QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 40,
      heightCm: 180,
      weightKg: 80,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 1,
      sessionMinutes: 50,
      preferredTrainingDays: [today],
      equipment: ['gym'],
      restrictions: [],
    }));

    localStorage.setItem('fitcoach_next_sessions_v1', '[{"id":"legacy-broken-session"}]');
    localStorage.setItem('fitcoach_next_food_log_v1', '[{"id":"legacy-broken-food"}]');
  });
}

test('iPhone RC quarantines malformed persisted activity without destroying recoverable raw data', async ({ page }) => {
  await page.goto('/');
  await seedCorruptActivity(page);

  const rawBefore = await page.evaluate(() => ({
    sessions: localStorage.getItem('fitcoach_next_sessions_v1'),
    food: localStorage.getItem('fitcoach_next_food_log_v1'),
  }));

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Recovery QA' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav).toBeVisible();

  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByText('NUTRICIÓN').first()).toBeVisible();

  await nav.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Progreso', exact: true })).toBeVisible();

  const rawAfterRead = await page.evaluate(() => ({
    sessions: localStorage.getItem('fitcoach_next_sessions_v1'),
    food: localStorage.getItem('fitcoach_next_food_log_v1'),
  }));
  expect(rawAfterRead).toEqual(rawBefore);

  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Recovery QA' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  const rawAfterColdRelaunch = await page.evaluate(() => ({
    sessions: localStorage.getItem('fitcoach_next_sessions_v1'),
    food: localStorage.getItem('fitcoach_next_food_log_v1'),
  }));
  expect(rawAfterColdRelaunch).toEqual(rawBefore);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
