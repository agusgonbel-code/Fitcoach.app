import { expect, test } from '@playwright/test';

async function prepareLegacyInstall(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('fitcoach_next_') || [
        'fitcoach_client_profile_v35',
        'fitcoach_nutrition_profile_v34',
        'workouts',
        'meals',
      ].includes(key)) localStorage.removeItem(key);
    }

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('fitcoach-next-media');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('No se pudo borrar IndexedDB'));
      request.onblocked = () => resolve();
    });

    const now = new Date();
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const timestamp = `${localDate}T07:15:00`;

    localStorage.setItem('fitcoach_client_profile_v35', JSON.stringify({
      name: 'Legacy RC',
      goal: 'gain',
      experience: 'advanced',
      sex: 'male',
      age: 46,
      height: 181,
      weight: 75,
      activity: 1.45,
      days: 4,
      minutes: 50,
      equipment: ['gym', 'cable'],
      limitations: 'knee pain',
    }));
    localStorage.setItem('workouts', JSON.stringify([{
      date: timestamp,
      day: 'legacy-upper',
      notes: 'Migración RC',
      exercises: [{
        name: 'Press banca',
        sets: [
          { kg: 80, reps: 8, rir: 2 },
          { kg: 80, reps: 7, rir: 1 },
        ],
      }],
    }]));
    localStorage.setItem('meals', JSON.stringify([{
      date: localDate,
      createdAt: `${localDate}T08:00:00`,
      name: 'Desayuno legacy RC',
      kcal: 510,
      protein: 36,
      carbs: 58,
      fat: 15,
    }]));
  });
}

test('iPhone RC migrates valid legacy profile and activity once without mutating legacy data', async ({ page }) => {
  await page.goto('/');
  await prepareLegacyInstall(page);

  const legacyBefore = await page.evaluate(() => ({
    profile: localStorage.getItem('fitcoach_client_profile_v35'),
    workouts: localStorage.getItem('workouts'),
    meals: localStorage.getItem('meals'),
  }));

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Hola, Legacy RC' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toHaveCount(0);

  const migrated = await page.evaluate(() => ({
    profile: JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || 'null'),
    sessions: JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]'),
    meals: JSON.parse(localStorage.getItem('fitcoach_next_food_log_v1') || '[]'),
    marker: localStorage.getItem('fitcoach_next_legacy_data_migration_v1'),
    legacy: {
      profile: localStorage.getItem('fitcoach_client_profile_v35'),
      workouts: localStorage.getItem('workouts'),
      meals: localStorage.getItem('meals'),
    },
  }));

  expect(migrated.profile).toMatchObject({
    name: 'Legacy RC',
    goal: 'hypertrophy',
    experience: 'advanced',
    age: 46,
    heightCm: 181,
    weightKg: 75,
    trainingDaysPerWeek: 4,
    sessionMinutes: 50,
  });
  expect(migrated.profile.restrictions).toContain('knee pain');
  expect(migrated.sessions).toHaveLength(1);
  expect(migrated.sessions[0].exercises[0].sets).toEqual(expect.arrayContaining([
    expect.objectContaining({ kg: 80, reps: 8, rir: 2 }),
    expect.objectContaining({ kg: 80, reps: 7, rir: 1 }),
  ]));
  expect(migrated.meals).toHaveLength(1);
  expect(migrated.meals[0]).toMatchObject({
    name: 'Desayuno legacy RC',
    kcal: 510,
    proteinG: 36,
    carbsG: 58,
    fatG: 15,
  });
  expect(migrated.marker).toBe('done');
  expect(migrated.legacy).toEqual(legacyBefore);

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Desayuno legacy RC' })).toBeVisible();
  await expect(page.getByText('510 kcal · 36P · 58C · 15G')).toBeVisible();

  await nav.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByText('2').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('1.5 RIR medio')).toBeVisible();

  await page.goto('about:blank');
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hola, Legacy RC' })).toBeVisible();
  const afterRelaunch = await page.evaluate(() => ({
    sessions: JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]'),
    meals: JSON.parse(localStorage.getItem('fitcoach_next_food_log_v1') || '[]'),
    legacyProfile: localStorage.getItem('fitcoach_client_profile_v35'),
    legacyWorkouts: localStorage.getItem('workouts'),
    legacyMeals: localStorage.getItem('meals'),
  }));
  expect(afterRelaunch.sessions).toHaveLength(1);
  expect(afterRelaunch.meals).toHaveLength(1);
  expect(afterRelaunch.legacyProfile).toBe(legacyBefore.profile);
  expect(afterRelaunch.legacyWorkouts).toBe(legacyBefore.workouts);
  expect(afterRelaunch.legacyMeals).toBe(legacyBefore.meals);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
