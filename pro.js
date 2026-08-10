(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;

  function state() {
    return {
      workouts: read('workouts', []),
      meals: read('meals', []),
      metrics: read('metrics', []),
      recovery: read('recovery', []),
      targets: read('targets', {protein:0,kcal:0}),
      settings: read('settings', {weeklySessionGoal:4}),
      profile: read('profile', {name:''})
    };
  }

  function monday() {
    const d = new Date(), day = d.getDay() || 7;
    d.setHours(0,0,0,0); d.setDate(d.getDate()-day+1);
    return d;
  }

  function readiness(r) {
    if (!r) return null;
    const sleep = clamp((Number(r.sleep)||0)/8*100,0,100);
    const energy = clamp((Number(r.energy)||3)/5*100,0,100);
    const stress = 100-clamp(((Number(r.stress)||3)-1)/4*100,0,100);
    const soreness = 100-clamp((Number(r.soreness)||1)/5*100,0,100);
    return Math.round(sleep*.35+energy*.30+stress*.20+soreness*.15);
  }

  function proteinAdherence(s) {
    const target = Number(s.targets.protein)||0;
    if (!target) return null;
    const cut = new Date(); cut.setHours(0,0,0,0); cut.setDate(cut.getDate()-6);
    const days = {};
    s.meals.filter(m=>new Date(m.date)>=cut).forEach(m=>{
      const k = new Date(m.date).toISOString().slice(0,10);
      days[k]=(days[k]||0)+Number(m.p ?? m.protein ?? 0);
    });
    const vals = Object.values(days);
    return vals.length ? Math.round(mean(vals.map(v=>clamp(v/target*100,0,120)))) : null;
  }

  function weightTrend(s) {
    const p=s.metrics.filter(m=>Number(m.weight)>0)
      .map(m=>({d:new Date(m.date),w:Number(m.weight)})).sort((a,b)=>a.d-b.d);
    if(p.length<2) return null;
    return p.at(-1).w-p[Math.max(0,p.length-6)].w;
  }

  function ensureStyle() {
    if ($('fc231style')) return;
    const st=document.createElement('style'); st.id='fc231style';
    st.textContent=`
      .fc231grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .fc231stat{padding:13px;border:1px solid var(--line);border-radius:16px;background:var(--panel2)}
      .fc231v{font-size:22px;font-weight:900}.fc231l{font-size:10px;color:var(--muted)}
      .fc231notice{margin-top:10px;padding:12px;border-radius:14px;background:rgba(47,211,116,.08);
        border:1px solid rgba(47,211,116,.22);line-height:1.45}
      .fc231badge{font-size:10px;padding:5px 8px;border-radius:999px;background:rgba(47,211,116,.12);
        border:1px solid rgba(47,211,116,.25);font-weight:850}
    `;
    document.head.appendChild(st);
  }

  function ensurePanel() {
    if ($('fc231panel')) return;
    const home=$('home'); if(!home) return;
    const h=document.createElement('h2'); h.textContent='Coach 360 · 2.3.1';
    const c=document.createElement('div'); c.id='fc231panel'; c.className='card';
    const anchor=$('homeCoach')?.parentElement || home.querySelector('.hero');
    if(anchor?.parentNode){
      anchor.parentNode.insertBefore(h,anchor.nextSibling);
      anchor.parentNode.insertBefore(c,h.nextSibling);
    } else { home.append(h,c); }
  }

  function render() {
    ensureStyle(); ensurePanel();
    const out=$('fc231panel'); if(!out) return;
    const s=state(), week=s.workouts.filter(w=>new Date(w.date)>=monday());
    const goal=Number(s.settings.weeklySessionGoal)||4;
    const r=readiness(s.recovery.at(-1));
    const p=proteinAdherence(s);
    const wt=weightTrend(s);
    const msg = r!==null && r<55
      ? 'Recuperación baja: mantén hoy una progresión conservadora y evita perseguir récords.'
      : week.length<goal && new Date().getDay()>=4
        ? `Llevas ${week.length}/${goal} sesiones. Prioriza completar el trabajo principal.`
        : 'El registro actual permite mantener el plan y progresar de forma conservadora.';
    out.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <strong>Estado actual</strong><span class="fc231badge">runtime reparado</span>
      </div>
      <div class="fc231grid">
        <div class="fc231stat"><div class="fc231v">${week.length}/${goal}</div><div class="fc231l">sesiones esta semana</div></div>
        <div class="fc231stat"><div class="fc231v">${r ?? '—'}</div><div class="fc231l">readiness</div></div>
        <div class="fc231stat"><div class="fc231v">${p===null?'—':p+'%'}</div><div class="fc231l">proteína reciente</div></div>
        <div class="fc231stat"><div class="fc231v">${wt===null?'—':(wt>=0?'+':'')+wt.toFixed(1)+' kg'}</div><div class="fc231l">tendencia peso</div></div>
      </div>
      <div class="fc231notice">${esc(msg)}</div>`;
  }

  function init(){
    render();
    document.addEventListener('click',()=>setTimeout(render,120));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')render()});
    window.FitCoachRuntime231={render,version:'2.3.1'};
  }
  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',init,{once:true})
    : init();
})();
