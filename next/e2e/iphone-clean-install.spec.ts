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

test('clean iPhone install starts safely, creates a usable plan and survives a cold relaunch', async ({ page }) => {
  await page.goto('/');
  await clearFitCoachNextStorage(page);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0);

  await page.getByLabel('Nombre').fill('RC Clean Install');
  await page.getByRole('button', { name: 'Crear mi plan' }).click();

  await expect(page.getByRole('heading', { name: 'Hola, RC Clean Install' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav).toBeVisible();

  const persisted = await page.evaluate(() => ({
    profile: JSON.parse(localStorage.getItem('fitcoach_next_profile_v1') || 'null'),
    sessions: JSON.parse(localStorage.getItem('fitcoach_next_sessions_v1') || '[]'),
  }));
  expect(persisted.profile?.name).toBe('RC Clean Install');
  expect(Array.isArray(persisted.profile?.preferredTrainingDays)).toBe(true);
  expect(persisted.profile?.preferredTrainingDays.length).toBeGreaterThan(0);
  expect(persisted.sessions).toHaveLength(0);

  await nav.getByRole('button', { name: 'Entrenar', exact: true }).click();
  await expect(page.getByText(/ENTRENAMIENTO|PLAN SEMANAL/).first()).toBeVisible();
  await nav.getByRole('button', { name: 'Nutrición', exact: true }).click();
  await expect(page.getByText('NUTRICIÓN').first()).toBeVisible();

  // Simula cerrar y volver a abrir Safari / la app: el estado persistido debe ser suficiente.
  await page.goto('about:blank');
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hola, RC Clean Install' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
