(() => {
  'use strict';
  const KEY = 'fitcoach_client_profile_v35';
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function ensureStyles() {
    if ($('fcIntakeStyle')) return;
    const style = document.createElement('style');
    style.id = 'fcIntakeStyle';
    style.textContent = `
      .fcIntakeLaunch{width:100%;margin:10px 0 0}.fcModal{position:fixed;inset:0;z-index:9999;background:rgba(2,8,23,.82);backdrop-filter:blur(12px);overflow:auto;padding:calc(env(safe-area-inset-top) + 18px) 14px 40px}.fcModal[hidden]{display:none}.fcIntake{max-width:760px;margin:auto;background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:28px;padding:18px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.fcIntakeHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.fcIntakeHead h2{margin:2px 0 4px}.fcIntakeHead p{margin:0;color:#94a3b8}.fcClose{width:auto;padding:8px 12px}.fcStep{display:none}.fcStep.active{display:block}.fcGrid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fcGrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.fcIntake label{display:grid;gap:6px;font-size:13px;color:#cbd5e1;margin:10px 0}.fcIntake input,.fcIntake select,.fcIntake textarea{width:100%}.fcChecks{display:flex;flex-wrap:wrap;gap:8px}.fcChecks label{display:flex;align-items:center;gap:6px;margin:0;padding:9px 11px;border:1px solid rgba(255,255,255,.12);border-radius:12px}.fcChecks input{width:auto}.fcStepper{display:flex;gap:7px;margin:14px 0}.fcStepper i{height:4px;flex:1;border-radius:999px;background:#334155}.fcStepper i.on{background:#39d176}.fcIntakeActions{display:flex;justify-content:space-between;gap:10px;margin-top:16px}.fcResult{margin-top:16px;padding:14px;border-radius:18px;background:#132238;border:1px solid rgba(57,209,118,.25)}.fcResult strong{font-size:18px}.fcResult ul{margin:8px 0 0;padding-left:20px;color:#cbd5e1}.fcEvidence{font-size:12px;color:#94a3b8;margin-top:10px}@media(max-width:620px){.fcGrid2,.fcGrid3{grid-template-columns:1fr}.fcIntake{border-radius:22px}.fcModal{padding-left:8px;padding-right:8px}}
    `;
    document.head.append(style);
  }

  function formMarkup(p) {
    const eq = new Set(p.equipment || []);
    const equipment = ['Mancuernas','Mancuerna','Barra','Polea','Máquina','Peso corporal'];
    return `
      <div class="fcStepper"><i class="on"></i><i></i><i></i><i></i></div>
      <section class="fcStep active" data-step="0"><h3>1 · Persona y objetivo</h3>
        <div class="fcGrid2"><label>Tipo<select id="fcMode"><option value="self" ${p.mode!=='client'?'selected':''}>Usuario</option><option value="client" ${p.mode==='client'?'selected':''}>Cliente</option></select></label><label>Nombre<input id="fcName" value="${escapeHtml(p.name||'')}"></label></div>
        <div class="fcGrid3"><label>Sexo<select id="fcSex"><option value="m" ${p.sex!=='f'?'selected':''}>Hombre</option><option value="f" ${p.sex==='f'?'selected':''}>Mujer</option></select></label><label>Edad<input id="fcAge" type="number" min="14" max="100" value="${p.age||35}"></label><label>Objetivo<select id="fcGoal"><option value="recomp" ${p.goal==='recomp'?'selected':''}>Recomposición</option><option value="loss" ${p.goal==='loss'?'selected':''}>Pérdida de grasa</option><option value="gain" ${p.goal==='gain'?'selected':''}>Ganancia muscular</option><option value="maintain" ${p.goal==='maintain'?'selected':''}>Mantenimiento</option></select></label></div>
        <div class="fcGrid3"><label>Altura cm<input id="fcHeight" type="number" min="120" max="230" value="${p.height||170}"></label><label>Peso kg<input id="fcWeight" type="number" min="35" max="350" step="0.1" value="${p.weight||70}"></label><label>Grasa % opcional<input id="fcBodyFat" type="number" min="3" max="70" step="0.1" value="${p.bodyFat??''}"></label></div><label>Cintura cm (opcional)<input id="fcWaist" type="number" min="45" max="200" step="0.1" value="${p.waist??''}"></label>
        <label>Actividad<select id="fcActivity"><option value="1.3" ${p.activity===1.3?'selected':''}>Baja</option><option value="1.45" ${p.activity===1.45?'selected':''}>Moderada</option><option value="1.6" ${p.activity===1.6?'selected':''}>Activa</option><option value="1.75" ${p.activity===1.75?'selected':''}>Muy activa</option></select></label>
      </section>
      <section class="fcStep" data-step="1"><h3>2 · Entrenamiento</h3>
        <div class="fcGrid3"><label>Experiencia<select id="fcExperience"><option value="beginner" ${p.experience==='beginner'?'selected':''}>Principiante</option><option value="intermediate" ${p.experience!=='beginner'&&p.experience!=='advanced'?'selected':''}>Intermedio</option><option value="advanced" ${p.experience==='advanced'?'selected':''}>Avanzado</option></select></label><label>Días/semana<input id="fcDays" type="number" min="2" max="6" value="${p.days||4}"></label><label>Minutos/sesión<input id="fcMinutes" type="number" min="30" max="90" step="5" value="${p.minutes||50}"></label></div>
        <label>Hora habitual de entrenamiento<input id="fcTrainingTime" type="time" value="${escapeHtml(p.trainingTime||'06:00')}"></label>
        <label>Material disponible<div class="fcChecks">${equipment.map(x=>`<label><input type="checkbox" name="fcEquipment" value="${x}" ${eq.size===0||eq.has(x)?'checked':''}>${x}</label>`).join('')}</div></label>
        <label>Limitaciones o lesiones<textarea id="fcLimitations" rows="2" placeholder="Ej.: molestia de hombro">${escapeHtml(p.limitations||'')}</textarea></label><label>Patologías o situaciones que requieren supervisión profesional<textarea id="fcConditions" rows="2">${escapeHtml(p.conditions||'')}</textarea></label><label>Ejercicios o movimientos contraindicados<textarea id="fcContraindications" rows="2">${escapeHtml(p.contraindications||'')}</textarea></label>
      </section>
      <section class="fcStep" data-step="2"><h3>3 · Nutrición</h3>
        <div class="fcGrid3"><label>Comidas/día<select id="fcMeals">${[3,4,5,6].map(n=>`<option ${Number(p.meals||4)===n?'selected':''}>${n}</option>`).join('')}</select></label><label>Reparto<select id="fcMealPattern"><option value="balanced" ${p.mealPattern==='balanced'?'selected':''}>Equilibrado</option><option value="breakfast" ${p.mealPattern==='breakfast'?'selected':''}>Desayuno más fuerte</option><option value="lunch" ${p.mealPattern==='lunch'?'selected':''}>Comida más fuerte</option><option value="dinner" ${p.mealPattern==='dinner'?'selected':''}>Cena más fuerte</option></select></label><label>Estilo<select id="fcDiet"><option value="mediterranean" ${p.diet!=='vegetarian'&&p.diet!=='vegan'?'selected':''}>Mediterránea</option><option value="omnivore" ${p.diet==='omnivore'?'selected':''}>Omnívora</option><option value="vegetarian" ${p.diet==='vegetarian'?'selected':''}>Vegetariana</option><option value="vegan" ${p.diet==='vegan'?'selected':''}>Vegana</option></select></label></div>
        <div class="fcGrid2"><label>Alergias/intolerancias<input id="fcAllergies" value="${escapeHtml(p.allergies||'')}"></label><label>No me gusta / evitar<input id="fcDislikes" value="${escapeHtml(p.dislikes||'')}"></label></div>
        <div class="fcGrid2"><label>Presupuesto<select id="fcBudget"><option value="low" ${p.budget==='low'?'selected':''}>Bajo</option><option value="medium" ${p.budget!=='low'&&p.budget!=='open'?'selected':''}>Medio</option><option value="open" ${p.budget==='open'?'selected':''}>Flexible</option></select></label><label>Tiempo máximo de cocina (min)<input id="fcCook" type="number" min="5" max="120" value="${p.cookMinutes||30}"></label></div>
        <div class="fcGrid2"><label>Horario habitual de comidas<input id="fcMealSchedule" value="${escapeHtml(p.mealSchedule||'')}"></label><label>Suplementos<input id="fcSupplements" value="${escapeHtml(p.supplements||'')}"></label></div><div class="fcChecks"><label><input id="fcCake" type="checkbox" ${p.includeBreakfastCake!==false?'checked':''}>Incluir bizcocho proteico en el desayuno</label><label><input id="fcShake" type="checkbox" ${p.includePostWorkoutShake!==false?'checked':''}>Incluir 30 g de whey postentreno</label></div>
      </section>
      <section class="fcStep" data-step="3"><h3>4 · Seguimiento</h3><p class="muted">Las fotos se gestionan en Progreso y se guardan localmente en este dispositivo. El perfil creado aquí será la única fuente de datos para nutrición y entrenamiento.</p><div id="fcIntakeResult" class="fcResult"><strong>Listo para generar</strong><ul><li>Calorías y macros</li><li>Reparto por comidas</li><li>Plan de entrenamiento</li><li>Menú de 30 días</li></ul></div></section>
      <div class="fcIntakeActions"><button id="fcPrev" class="secondary" type="button">Anterior</button><button id="fcNext" type="button">Siguiente</button><button id="fcGenerate" type="button" hidden>Generar mi plan</button></div>`;
  }

  function collect() {
    return {
      mode:$('fcMode').value,name:$('fcName').value,sex:$('fcSex').value,age:+$('fcAge').value,height:+$('fcHeight').value,weight:+$('fcWeight').value,waist:$('fcWaist').value,
      bodyFat:$('fcBodyFat').value,activity:+$('fcActivity').value,goal:$('fcGoal').value,experience:$('fcExperience').value,days:+$('fcDays').value,minutes:+$('fcMinutes').value,weeks:8,
      equipment:[...document.querySelectorAll('[name="fcEquipment"]:checked')].map(x=>x.value),limitations:$('fcLimitations').value,conditions:$('fcConditions').value,contraindications:$('fcContraindications').value,trainingTime:$('fcTrainingTime').value,includeBreakfastCake:$('fcCake').checked,includePostWorkoutShake:$('fcShake').checked,meals:+$('fcMeals').value,mealPattern:$('fcMealPattern').value,diet:$('fcDiet').value,
      allergies:$('fcAllergies').value,dislikes:$('fcDislikes').value,mealSchedule:$('fcMealSchedule').value,supplements:$('fcSupplements').value,budget:$('fcBudget').value,cookMinutes:+$('fcCook').value
    };
  }

  function syncLegacy(profile, nutrition, plan, menu) {
    write(KEY, profile);
    write('profile', { ...(read('profile',{})), name: profile.name });
    write('fitcoach_nutrition_profile_v34', { sex:profile.sex, age:profile.age, height:profile.height, weight:profile.weight, bodyFat:profile.bodyFat ?? 20, activity:profile.activity, goal:profile.goal, equation:profile.bodyFat!=null?'katch':'mifflin' });
    write('targets', nutrition.targets);
    write('fitcoach_active_plan_v33', plan);
    write('fitcoach_menu_30_v35', menu);
    const mappings = {calcSex:profile.sex,calcAge:profile.age,calcHeight:profile.height,calcWeight:profile.weight,calcFat:profile.bodyFat??'',calcActivity:profile.activity,calcGoal:profile.goal,days:profile.days,minutes:profile.minutes,menuMeals:profile.meals};
    Object.entries(mappings).forEach(([id,v]) => { if ($(id)) $(id).value = String(v); });
  }

  function renderMenu(menu) {
    const root = $('menuOutput'); if (!root || !menu) return;
    const ingMap = Object.fromEntries([...(window.FITCOACH_NUTRITION?.ingredients||[]),{id:'chia',name:'Semillas de chía'},{id:'bakingpowder',name:'Levadura química'}].map(x=>[x.id,x]));
    root.innerHTML = menu.days.map(day => `<details class="card" ${day.day===1?'open':''}><summary><strong>Día ${day.day}${day.trainingDay?' · Entreno '+escapeHtml(day.trainingTime):' · Descanso'}</strong> · ${Math.round(day.totals.kcal)} kcal · ${Math.round(day.totals.protein)}P · ${day.withinTolerance?'✓ dentro de tolerancia':'⚠ revisar'}</summary>${day.meals.map((meal,i)=>`<div class="card"><strong>${i+1}. ${meal.time?escapeHtml(meal.time)+' · ':''}${escapeHtml(meal.name)}</strong><div class="muted">Objetivo ${Math.round(meal.target.kcal)} kcal · Cálculo real ${Math.round(meal.macros.kcal)} kcal · ${Math.round(meal.macros.p)}P ${Math.round(meal.macros.c)}C ${Math.round(meal.macros.f)}G</div>${meal.ingredients.map(([id,g])=>`<div class="foodrow"><span>${escapeHtml(ingMap[id]?.name||id)}</span><b>${g} g</b></div>`).join('')}</div>`).join('')}${day.withinTolerance?'':`<div class="card"><strong>Este día necesita ajuste</strong><div class="muted">No se han sustituido los macros reales por cifras objetivo. Cambia una receta o revisa cantidades antes de usarlo.</div></div>`}</details>`).join('');
    if ($('menuSummary')) $('menuSummary').innerHTML = `<div class="card"><strong>Plan personalizado · ${menu.profile.meals} comidas/día</strong><div class="muted">Objetivo ${menu.targets.kcal} kcal · ${menu.targets.protein}P · reparto ${menu.profile.mealPattern}. Tolerancia visible: kcal ±3%, proteína ±5%, carbohidratos ±6% y grasa ±8%.</div></div>`;
  }

  function generate() {
    const engine = globalThis.FitCoachClientEngine;
    if (!engine) return;
    const profile = engine.normalizeProfile(collect());
    const nutrition = engine.calculateNutrition(profile);
    const plan = engine.buildTrainingPlan(profile, window.FITCOACH_DATA?.exercises || []);
    const menu = engine.generateMenu(profile, nutrition.targets, window.FITCOACH_NUTRITION?.recipes || [], window.FITCOACH_NUTRITION?.ingredients || [], 30);
    syncLegacy(profile, nutrition, plan, menu);
    renderMenu(menu);
    $('fcIntakeResult').innerHTML = `<strong>${nutrition.targets.kcal} kcal · ${nutrition.targets.protein}P · ${nutrition.targets.carbs}C · ${nutrition.targets.fat}G</strong><ul><li>${profile.meals} comidas con kcal repartidas automáticamente</li><li>${profile.days} días de entrenamiento · máximo ${profile.minutes} min</li><li>Plan guardado como perfil único para usuario/cliente</li></ul><div class="fcEvidence">Base: Mifflin/Katch para estimación energética; entrenamiento con volumen, múltiples series y proximidad al fallo según revisiones sistemáticas. No sustituye valoración médica.</div>`;
    setTimeout(() => {
      if ($('fcIntakeModal')) $('fcIntakeModal').hidden = true;
      document.querySelectorAll('main .page').forEach(page=>page.classList.toggle('active',page.id==='nutrition'));
      document.querySelectorAll('nav [data-go]').forEach(button=>button.classList.toggle('active',button.dataset.go==='nutrition'));
      document.querySelectorAll('#nutrition .nut').forEach(panel=>panel.hidden=panel.id!=='menus');
      document.querySelectorAll('#nutrition [data-tab]').forEach(button=>button.classList.toggle('active',button.dataset.tab==='menus'));
      renderMenu(menu);
      setTimeout(()=>renderMenu(menu),250);
    }, 350);
  }

  function install() {
    ensureStyles();
    const saved = globalThis.FitCoachClientEngine?.normalizeProfile(read(KEY, {})) || read(KEY, {});
    const modal = document.createElement('div'); modal.id='fcIntakeModal'; modal.className='fcModal'; modal.hidden=true;
    modal.innerHTML = `<div class="fcIntake"><div class="fcIntakeHead"><div><small>PERFIL ÚNICO</small><h2>Configurar usuario o cliente</h2><p>Un solo formulario genera nutrición y entrenamiento.</p></div><button id="fcClose" class="secondary fcClose">Cerrar</button></div><div id="fcIntakeBody">${formMarkup(saved)}</div></div>`;
    document.body.append(modal);
    let step=0; const steps=[...modal.querySelectorAll('.fcStep')], bars=[...modal.querySelectorAll('.fcStepper i')];
    const paint=()=>{steps.forEach((x,i)=>x.classList.toggle('active',i===step));bars.forEach((x,i)=>x.classList.toggle('on',i<=step));$('fcPrev').hidden=step===0;$('fcNext').hidden=step===steps.length-1;$('fcGenerate').hidden=step!==steps.length-1;};
    $('fcPrev').onclick=()=>{step=Math.max(0,step-1);paint();}; $('fcNext').onclick=()=>{step=Math.min(steps.length-1,step+1);paint();}; $('fcClose').onclick=()=>modal.hidden=true; $('fcGenerate').onclick=generate;
    const open=()=>{modal.hidden=false;step=0;paint();};
    const settings=$('settings'); if(settings){const card=settings.querySelector('.card')||settings;const btn=document.createElement('button');btn.className='fcIntakeLaunch';btn.textContent='Configurar usuario / cliente';btn.onclick=open;card.prepend(btn);}
    const home=$('home'); if(home){const btn=document.createElement('button');btn.className='secondary fcIntakeLaunch';btn.textContent='Perfil y plan personalizado';btn.onclick=open;home.prepend(btn);}
    const currentMenu=read('fitcoach_menu_30_v35',null); if(currentMenu){renderMenu(currentMenu);setTimeout(()=>renderMenu(currentMenu),500);}
    document.addEventListener('click',event=>{if(/30 días/i.test(event.target?.textContent||''))setTimeout(()=>renderMenu(read('fitcoach_menu_30_v35',null)),80);});
    if(!localStorage.getItem(KEY)) setTimeout(open,250);
  }

  const boot=()=>{ if(!globalThis.FitCoachClientEngine){setTimeout(boot,50);return;} document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install(); };
  boot();
})();


