const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173';
async function seedProfile(page){await page.addInitScript(()=>localStorage.setItem('fitcoach_client_profile_v35',JSON.stringify({name:'QA',sex:'m',age:40,height:178,weight:80,bodyFat:20,activity:1.45,goal:'recomp',experience:'intermediate',days:4,minutes:50,weeks:8,equipment:['Máquina','Mancuernas','Barra','Polea'],meals:4,mealPattern:'balanced',diet:'mediterranean',budget:'medium',cookMinutes:30})))}
async function openNutrition(page){await page.locator('[data-go="nutrition"]').click();await expect(page.locator('#doCalc')).toBeVisible()}
const activeField=(page,modern,legacy)=>page.locator(`#${modern},#${legacy}`).filter({visible:true}).first();

test('fresh FitCoach launch never injects personal identity or anthropometrics',async({page})=>{
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('profile')||'null'));
  expect(profile).toEqual({name:''});
  await expect(page.locator('#greeting')).not.toContainText('Agustín');
  await page.locator('[data-go="nutrition"]').click();
  await expect(page.locator('#doCalc')).toBeVisible();
  await expect(page.locator('#age,#calcAge').first()).toHaveValue('');
  await expect(page.locator('#hei,#calcHeight').first()).toHaveValue('');
  await expect(page.locator('#wei,#calcWeight').first()).toHaveValue('');
  await expect(page.locator('#bf,#calcFat').first()).toHaveValue('');
});

test('FitCoach rejects unsupported low calorie calculations before persisting targets',async({page})=>{
  await seedProfile(page);
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.FitCoachQualityV48));
  await openNutrition(page);
  await page.locator('#sx').selectOption('f');
  await page.locator('#age').fill('100');
  await page.locator('#hei').fill('120');
  await page.locator('#wei').fill('35');
  await page.locator('#act').selectOption('1.3');
  await page.locator('#ng').selectOption('loss');
  await page.locator('#eq').selectOption('mifflin');
  const before=await page.evaluate(()=>localStorage.getItem('targets'));
  await page.locator('#doCalc').click();
  await expect(page.locator('#macro')).toContainText('fuera del rango compatible');
  expect(await page.evaluate(()=>localStorage.getItem('targets'))).toBe(before);
});

test('FitCoach accepts normal macro inputs and labels form controls for assistive tech',async({page})=>{
  await seedProfile(page);
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.FitCoachQualityV48));
  await openNutrition(page);
  await expect(page.locator('#age')).toHaveAttribute('aria-label','Edad');
  await expect(page.locator('#wei')).toHaveAttribute('aria-label','Peso en kilogramos');
  await expect(page.locator('#act')).toHaveAttribute('aria-label','Nivel de actividad');
  await page.locator('#doCalc').click();
  await expect(page.locator('#macro')).toContainText('kcal');
});