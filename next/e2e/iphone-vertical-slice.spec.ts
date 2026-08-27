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

test('complete backup restores training, nutrition, metrics and photos after local data is erased', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const localDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-backup-user', name: 'Backup QA', goal: 'recomp', experience: 'intermediate', sex: 'male', age: 40,
      heightCm: 180, weightKg: 80, activityMultiplier: 1.45, trainingDaysPerWeek: 3, sessionMinutes: 50,
      preferredTrainingDays: [0, 2, 4], equipment: ['gym'], restrictions: [],
    }));
    localStorage.setItem('fitcoach_next_sessions_v1', JSON.stringify([{
      id: 'session-backup-1', plannedWorkoutId: 'planned-backup-1', localDate, startedAt: now, completedAt: now,
      exercises: [{ exerciseId: 'bench-press', sets: [{ kg: 80, reps: 10, rir: 0, completedAt: now }] }],
    }]));
    localStorage.setItem('fitcoach_next_food_log_v1', JSON.stringify([{
      id: 'food-backup-1', localDate, name: 'Pollo con arroz', kcal: 650, proteinG: 55, carbsG: 72, fatG: 14, createdAt: now,
    }]));
    localStorage.setItem('fitcoach_next_body_metrics_v1', JSON.stringify([{
      id: 'metric-backup-1', localDate, weightKg: 80.2, waistCm: 84, bodyFatPct: 16, createdAt: now,
    }]));
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Backup QA' })).toBeVisible();

  await page.evaluate(async () => {
    const request = indexedDB.open('fitcoach-next-media', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onupgradeneeded = () => {
        const current = request.result;
        if (!current.objectStoreNames.contains('progress-photos')) {
          const store = current.createObjectStore('progress-photos', { keyPath: 'id' });
          store.createIndex('localDate', 'localDate');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const localDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const tx = db.transaction('progress-photos', 'readwrite');
    tx.objectStore('progress-photos').put({
      id: 'photo-backup-1', localDate, pose: 'front', weightKg: 80.2, mimeType: 'image/jpeg', width: 1, height: 1,
      createdAt: new Date().toISOString(), blob: new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' }),
    });
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  });

  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Copia completa' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  await expect(page.getByRole('status')).toContainText('1 foto(s) incluidas');

  await page.evaluate(async () => {
    localStorage.removeItem('fitcoach_next_profile_v1');
    localStorage.setItem('fitcoach_next_sessions_v1', '[]');
    localStorage.setItem('fitcoach_next_food_log_v1', '[]');
    localStorage.setItem('fitcoach_next_body_metrics_v1', '[]');
    const request = indexedDB.deleteDatabase('fitcoach-next-media');
    await new Promise<void>((resolve, reject) => { request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  });

  page.once('dialog', dialog => void dialog.accept());
  await page.getByLabel('Seleccionar copia de FitCoach Next').setInputFiles(backupPath!);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Hola, Backup QA' })).toBeVisible();

  const restored = await page.evaluate(async () => {
    const profile = JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || 'null');
    const sessions = JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]');
    const foodLog = JSON.parse(localStorage.getItem('fitcoach_next_food_log_v1') || '[]');
    const metrics = JSON.parse(localStorage.getItem('fitcoach_next_body_metrics_v1') || '[]');
    const request = indexedDB.open('fitcoach-next-media', 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('progress-photos', 'readonly');
    const photos = await new Promise<any[]>((resolve, reject) => {
      const getAll = tx.objectStore('progress-photos').getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    });
    db.close();
    return { profile, sessions, foodLog, metrics, photos: photos.map(photo => ({ id: photo.id, pose: photo.pose, weightKg: photo.weightKg, size: photo.blob?.size })) };
  });

  expect(restored.profile?.name).toBe('Backup QA');
  expect(restored.sessions).toHaveLength(1);
  expect(restored.sessions[0].exercises[0].sets[0]).toMatchObject({ kg: 80, reps: 10, rir: 0 });
  expect(restored.foodLog).toHaveLength(1);
  expect(restored.foodLog[0]).toMatchObject({ name: 'Pollo con arroz', kcal: 650, proteinG: 55 });
  expect(restored.metrics).toHaveLength(1);
  expect(restored.metrics[0]).toMatchObject({ weightKg: 80.2, waistCm: 84, bodyFatPct: 16 });
  expect(restored.photos).toEqual([{ id: 'photo-backup-1', pose: 'front', weightKg: 80.2, size: 4 }]);
});
