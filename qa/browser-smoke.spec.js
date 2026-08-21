const { test, expect } = require('@playwright/test');
test('unified intake opens, generates and persists without page errors', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#fcIntakeModal')).toBeVisible();
  await expect(page.getByText('Configurar usuario o cliente')).toBeVisible();
  await page.locator('#fcNext').click(); await page.locator('#fcNext').click(); await page.locator('#fcNext').click();
  await expect(page.locator('#fcGenerate')).toBeVisible();
  await page.locator('#fcGenerate').click();
  await page.waitForFunction(()=>localStorage.getItem('fitcoach_client_profile_v35')!==null);
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('fitcoach_client_profile_v35')));
  const targets=await page.evaluate(()=>JSON.parse(localStorage.getItem('targets')));
  expect(profile.days).toBeGreaterThanOrEqual(2); expect(profile.meals).toBeGreaterThanOrEqual(3);
  expect(targets.kcal).toBeGreaterThan(1000); expect(targets.protein).toBeGreaterThan(40);
  expect(errors).toEqual([]);
});