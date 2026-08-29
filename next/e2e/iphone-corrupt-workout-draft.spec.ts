import { expect, test } from '@playwright/test';

async function clearFitCoachNextStorage(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fitcoach_next_')) localStorage.removeItem(key);
    }

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('fitcoach-next-media');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('No se pudo borrar IndexedDB'));
      request.onblocked = () => resolve();
    });
  });
}

test('iPhone RC quarantines a corrupt workout draft without deleting recovery data or blocking the app', async ({ page }) => {
  await page.goto('/');
  await clearFitCoachNextStorage(page);
  await page.reload();

  await page.getByLabel('Nombre').fill('RC Draft Recovery');
  await page.getByRole('button', { name: 'Crear mi plan' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, RC Draft Recovery' })).toBeVisible();

  // Guarantee that today is one of the preferred training days so boot recovery executes.
  const today = await page.evaluate(() => {
    const now = new Date();
    const weekday = (now.getDay() + 6) % 7;
    const profile = JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || 'null');
    const fallback = [0, 1, 2, 3, 4, 5, 6].filter((day) => day !== weekday).slice(0, 3);
    profile.trainingDaysPerWeek = 4;
    profile.preferredTrainingDays = [weekday, ...fallback].sort((a: number, b: number) => a - b);
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify(profile));
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  });

  await page.reload();
  await expect(page.getByText('TU ENTRENAMIENTO')).toBeVisible();

  const corruptRaw = await page.evaluate((localDate) => {
    const raw = JSON.stringify({
      version: 1,
      workoutId: 'corrupt-but-present',
      localDate,
      startedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
      values: {
        'bench-press': [{ kg: '80', reps: null, rir: '0' }],
      },
    });
    localStorage.setItem('fitcoach_next_workout_draft_v1', raw);
    return raw;
  }, today);

  // A corrupt persisted draft must not auto-route into an active workout on boot.
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, RC Draft Recovery' })).toBeVisible();
  await expect(page.getByText('TU ENTRENAMIENTO')).toBeVisible();

  const rawAfterBoot = await page.evaluate(() => localStorage.getItem('fitcoach_next_workout_draft_v1'));
  expect(rawAfterBoot).toBe(corruptRaw);

  // The training surface must remain fully reachable despite the quarantined draft.
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Entrenar', exact: true }).click();
  await expect(page.getByText(/ENTRENAMIENTO/).first()).toBeVisible();

  // A second cold relaunch must remain safe and must not mutate the raw recovery payload.
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, RC Draft Recovery' })).toBeVisible();
  const rawAfterRelaunch = await page.evaluate(() => localStorage.getItem('fitcoach_next_workout_draft_v1'));
  expect(rawAfterRelaunch).toBe(corruptRaw);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
