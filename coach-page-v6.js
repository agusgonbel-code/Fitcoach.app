(()=>{'use strict';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const safe=v=>Number.isFinite(Number(v))?Number(v):0;
const localDay=()=>globalThis.FitCoachLocalDate?.localDateKey?.()||new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function snapshot(){
  const profile=read('fitcoach_client_profile_v35',read('fitcoach_v5_profile',{}));
  const targets=read('targets',{kcal:0,protein:0,carbs:0,fat:0});
  const meals=read('meals',[]).filter(x=>x.date===localDay());
  const workouts=read('workouts',[]);
  const metrics=read('metrics',[]).filter(x=>safe(x.weight)>0);
  const plan=read('fitcoach_active_plan_v33',null);
  const check=read('fitcoach_v5_checkin',{energy:7,soreness:3,stress:4,sleep:profile.sleep||7});
  const consumed=meals.reduce((o,m)=>({kcal:o.kcal+safe(m.kcal),protein:o.protein+safe(m.protein),carbs:o.carbs+safe(m.carbs),fat:o.fat+safe(m.fat)}),{kcal:0,protein:0,carbs:0,fat:0});
  const weekStart=new Date(); weekStart.setDate(weekStart.getDate()-6); weekStart.setHours(0,0,0,0);
  const week=workouts.filter(w=>new Date(w.date)>=weekStart);
  const weights=metrics.slice(-8).map(x=>safe(x.weight));
  const trend=weights.length>1?+(weights.at(-1)-weights[0]).toFixed(2):0;
  const readiness=Math.max(35,Math.min(100,Math.round(72+(safe(check.energy)-5)*4-(safe(check.soreness)-4)*2-(safe(check.stress)-5)*2+(safe(check.sleep)-7)*3)));
  return{profile,targets,consumed,week,workouts,metrics,plan,check,trend,readiness};
}
function recommendations(s){
  const out=[];
  const goal=s.profile.goal||s.plan?.goal||'recomp';
  const planned=s.profile.days||s.plan?.days||4;
  const proteinLeft=Math.max(0,Math.round(s.targets.protein-s.consumed.protein));
  const kcalLeft=Math.round(s.targets.kcal-s.consumed.kcal);
  if(s.readiness<55)out.push(['Recuperación','Reduce hoy 1 serie por ejercicio y trabaja aproximadamente a 2–4 RIR.']);
  else if(s.readiness<72)out.push(['Entrenamiento','Mantén cargas y prioriza técnica; evita buscar récords si el rendimiento no acompaña.']);
  else out.push(['Progresión','Si completas el rango alto con 1–2 RIR y técnica estable, aplica la progresión sugerida.']);
  if(s.week.length<Math.max(1,planned-1))out.push(['Adherencia',`Has completado ${s.week.length}/${planned} sesiones recientes. Prioriza completar el plan antes de añadir más volumen.`]);
  if(proteinLeft>10)out.push(['Nutrición',`Te faltan aproximadamente ${proteinLeft} g de proteína para el objetivo diario.`]);
  else if(s.targets.protein>0)out.push(['Nutrición','La proteína de hoy está cerca del objetivo. Mantén el reparto previsto.']);
  if(kcalLeft>200)out.push(['Energía',`Quedan unas ${kcalLeft} kcal respecto al objetivo de hoy.`]);
  if(goal==='gain'&&s.trend<-.5)out.push(['Tendencia de peso','El peso reciente baja pese a un objetivo de ganancia. Revisa adherencia y considera un ajuste gradual de energía.']);
  if((goal==='loss'||goal==='fatloss')&&s.trend>.5)out.push(['Tendencia de peso','El peso reciente sube pese al objetivo de pérdida. Revisa el promedio semanal antes de modificar calorías.']);
  if(!s.metrics.length)out.push(['Seguimiento','Registra peso y medidas con regularidad para que el Coach pueda detectar tendencias.']);
  return out.slice(0,6);
}
function render(){
  const page=document.getElementById('coachPage'); if(!page)return;
  const s=snapshot(),r=recommendations(s),name=s.profile.name||read('profile',{}).name||'Usuario';
  page.innerHTML=`<h1>Coach</h1><div class="hero"><div class="tiny">COACH ADAPTATIVO</div><h2>${esc(name)}, hoy tu readiness es ${s.readiness}/100</h2><p>Recomendaciones basadas en entrenamiento registrado, nutrición, recuperación y tendencia de peso.</p></div><div class="grid"><div class="card"><div class="stat">${s.week.length}/${s.profile.days||s.plan?.days||4}</div><div class="label">sesiones recientes</div></div><div class="card"><div class="stat">${Math.round(s.consumed.protein)} g</div><div class="label">proteína hoy</div></div><div class="card"><div class="stat">${s.trend>0?'+':''}${s.trend} kg</div><div class="label">tendencia peso</div></div><div class="card"><div class="stat">${s.readiness}</div><div class="label">readiness</div></div></div><div class="card"><h2>Prioridades de hoy</h2>${r.map(([t,m],i)=>`<div class="foodrow"><div><strong>${i+1}. ${esc(t)}</strong><div class="muted">${esc(m)}</div></div></div>`).join('')}</div><div class="card"><strong>Importante</strong><div class="muted">FitCoach ofrece orientación de entrenamiento y nutrición, no diagnóstico médico. Ante dolor agudo, enfermedad, embarazo, trastornos alimentarios u otras situaciones clínicas, consulta a un profesional sanitario.</div></div>`;
}
function install(){
  if(document.getElementById('coachPage'))return;
  const main=document.querySelector('main'),nav=document.querySelector('nav'); if(!main||!nav)return;
  const page=document.createElement('section');page.id='coachPage';page.className='page';main.appendChild(page);
  const btn=document.createElement('button');btn.dataset.go='coachPage';btn.textContent='Coach';nav.insertBefore(btn,nav.querySelector('[data-go="settings"]')||null);
  btn.addEventListener('click',()=>{document.querySelectorAll('main .page').forEach(p=>p.classList.toggle('active',p.id==='coachPage'));document.querySelectorAll('nav [data-go]').forEach(b=>b.classList.toggle('active',b===btn));render();});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="coachPage"]'))setTimeout(render,0);});
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
globalThis.FitCoachCoachPageV6={snapshot,recommendations,render,install};
})();
