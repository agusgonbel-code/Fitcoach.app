const { test, expect } = require('@playwright/test');
const BASE='http://127.0.0.1:4173';
async function completeIntake(page){for(let i=0;i<3;i++)await page.locator('#fcNext').click();await page.locator('#fcGenerate').click();await page.waitForFunction(()=>localStorage.getItem('fitcoach_client_profile_v35')!==null)}
function nameOf(el){return (el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').trim()}

test('FitCoach has unique ids, labelled controls and usable touch targets',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await completeIntake(page);
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id).filter(Boolean));
  expect(new Set(ids).size,'duplicate DOM ids').toBe(ids.length);
  const badImages=await page.locator('img').evaluateAll(nodes=>nodes.filter(n=>!n.hasAttribute('alt')).map(n=>n.src));
  expect(badImages,'images without alt').toEqual([]);
  const nav=page.locator('nav button');
  for(let i=0;i<await nav.count();i++){
    const b=nav.nth(i);if(!(await b.isVisible()))continue;
    const box=await b.boundingBox();expect(box?.height||0,`nav target ${i} too short`).toBeGreaterThanOrEqual(44);
    expect(await b.evaluate(nameOf),`nav target ${i} has no accessible name`).not.toBe('');
    await b.click();await page.waitForTimeout(30);
    const unnamed=await page.locator('button:visible,input:visible,select:visible,textarea:visible').evaluateAll(nodes=>nodes.filter(el=>{
      if(el.tagName==='INPUT'||el.tagName==='SELECT'||el.tagName==='TEXTAREA'){
        const id=el.id,lab=id&&document.querySelector(`label[for="${CSS.escape(id)}"]`);
        return !(el.getAttribute('aria-label')||el.getAttribute('placeholder')||lab?.textContent?.trim());
      }
      return !nameOf(el);
    }).map(el=>el.outerHTML.slice(0,180)));
    expect(unnamed,`unnamed controls after nav ${i}`).toEqual([]);
  }
  await context.close();
});

test('FitCoach exposes keyboard focus indication and reduced-motion-safe CSS',async({page})=>{
  const css=await (await page.request.get(BASE+'/styles.css')).text();
  expect(css).toMatch(/focus-visible/i);
  expect(css).toMatch(/prefers-reduced-motion/i);
});
