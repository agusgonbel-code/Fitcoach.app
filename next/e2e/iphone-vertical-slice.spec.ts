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

test('profile survives a mobile reload after onboarding', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nombre').fill('Persistencia QA');
  await page.getByRole('button', { name: 'Crear mi plan' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Persistencia QA' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Persistencia QA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toHaveCount(0);
});
