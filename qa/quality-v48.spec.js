const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173';
async function seedProfile(page){await page.addInitScript(()=>localStorage.setItem('fitcoach_client_profile_v35',JSON.stringify({name:'QA',sex:'m',age:40,height:178,weight:80,activity:1.45,goal:'recomp',experience:'intermediate',days:4,minutes:50,equipment:['Máquina','Mancuernas','Barra','Polea']})))}

test('fresh FitCoach launch never injects a personal name',async({page})=>{
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('profile')||'null'));
  expect(profile).toEqual({name:''});
  await expect(page.locator('#greeting')).not.toContainText('Agustín');
});

test('FitCoach rejects unsupported low calorie calculations before persisting targets',async({page})=>{
  await seedProfile(page);
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.FitCoachQualityV48));
  await page.locator('[data-go="nutrition"]').click();
  await page.locator('#calcSex').selectOption('f');
  await page.locator('#calcAge').fill('100');
  await page.locator('#calcHeight').fill('120');
  await page.locator('#calcWeight').fill('35');
  await page.locator('#calcActivity').selectOption('1.3');
  await page.locator('#calcGoal').selectOption('loss');
  const before=await page.evaluate(()=>localStorage.getItem('targets'));
  await page.locator('#calculateMacros').click();
  await expect(page.locator('#macroResult')).toContainText('fuera del rango compatible');
  expect(await page.evaluate(()=>localStorage.getItem('targets'))).toBe(before);
});

test('FitCoach accepts normal macro inputs and labels form controls for assistive tech',async({page})=>{
  await seedProfile(page);
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.FitCoachQualityV48));
  await page.locator('[data-go="nutrition"]').click();
  await expect(page.locator('#calcAge')).toHaveAttribute('aria-label','Edad');
  await expect(page.locator('#calcWeight')).toHaveAttribute('aria-label','Peso');
  await page.locator('#calculateMacros').click();
  await expect(page.locator('#macroResult')).toContainText('kcal');
});
