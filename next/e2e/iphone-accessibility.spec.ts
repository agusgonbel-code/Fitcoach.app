import { expect, test } from '@playwright/test';

const interactiveSelector = 'button, a[href], input:not([type="hidden"]), select, textarea';

test('onboarding exposes labelled controls and usable touch targets on iPhone', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu plan empieza contigo' })).toBeVisible();

  for (const label of [
    'Nombre',
    'Objetivo',
    'Experiencia',
    'Sexo para cálculo',
    'Edad',
    'Altura cm',
    'Peso kg',
    'Actividad',
    'Días/semana',
    'Minutos',
    'Equipamiento',
    'Limitaciones',
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }

  const unnamedControls = await page.locator(interactiveSelector).evaluateAll(elements => elements
    .filter(element => {
      const html = element as HTMLElement;
      if (html.getAttribute('aria-hidden') === 'true') return false;
      const labelledBy = html.getAttribute('aria-labelledby');
      const ariaLabel = html.getAttribute('aria-label');
      const text = html.textContent?.trim();
      const id = html.getAttribute('id');
      const wrappedLabel = html.closest('label')?.textContent?.trim();
      const explicitLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() : '';
      const placeholder = html.getAttribute('placeholder');
      return !labelledBy && !ariaLabel && !text && !wrappedLabel && !explicitLabel && !placeholder;
    })
    .map(element => element.outerHTML));
  expect(unnamedControls).toEqual([]);

  for (const day of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']) {
    const chip = page.getByRole('button', { name: day, exact: true });
    await expect(chip).toHaveAttribute('aria-pressed', /true|false/);
  }

  const createPlan = page.getByRole('button', { name: 'Crear mi plan' });
  const box = await createPlan.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
});

test('authenticated shell keeps primary navigation named, reachable and touch-friendly', async ({ page }) => {
  await page.addInitScript(() => {
    const today = (new Date().getDay() + 6) % 7;
    localStorage.setItem('fitcoach_next_profile_v1', JSON.stringify({
      id: 'qa-a11y-user',
      name: 'Accesibilidad QA',
      goal: 'recomp',
      experience: 'intermediate',
      sex: 'male',
      age: 40,
      heightCm: 180,
      weightKg: 80,
      activityMultiplier: 1.45,
      trainingDaysPerWeek: 2,
      sessionMinutes: 50,
      preferredTrainingDays: [today, (today + 3) % 7],
      equipment: ['gym'],
      restrictions: [],
    }));
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Accesibilidad QA' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Abrir perfil' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav).toBeVisible();

  for (const label of ['Hoy', 'Entrenar', 'Nutrición', 'Progreso', 'Perfil']) {
    const button = nav.getByRole('button', { name: label, exact: true });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }

  await nav.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
