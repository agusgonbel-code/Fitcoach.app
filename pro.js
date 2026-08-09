(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
  const dayKey = date => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const startOfDaysAgo = days => {
    const d = new Date();
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-days);
    return d;
  };
  const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

  function state() {
    return {
      workouts: read('workouts', []),
      meals: read('meals', []),
      metrics: read('metrics', []),
      recovery: read('recovery', []),
      targets: read('targets', {kcal:0,protein:0}),
      settings: read('settings', {weeklySessionGoal:4}),
      profile: read('profile', {name:''})
    };
  }

  function injectStyle() {
    if ($('fcProStyle')) return;
    const style = document.createElement('style');
    style.id = 'fcProStyle';
    style.textContent = `
      .fcProGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .fcProStat{padding:13px;border:1px solid var(--line);border-radius:16px;background:var(--panel2)}
      .fcProValue{font-size:22px;font-weight:900;letter-spacing:-.5px}
      .fcProLabel{font-size:10px;color:var(--muted);margin-top:4px}
      .fcProAdvice{padding:12px;border-radius:14px;border:1px solid rgba(47,211,116,.22);background:rgba(47,211,116,.08);line-height:1.45}
      .fcProWarn{border-color:rgba(255,182,72,.28);background:rgba(255,182,72,.08)}
      .fcProList{display:grid;gap:8px;margin-top:10px}
      .fcProItem{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding:8px 0}
      .fcProItem:last-child{border-bottom:0}
      .fcProBar{height:8px;background:#07111f;border-radius:999px;overflow:hidden;margin-top:7px}
      .fcProBar>div{height:100%;background:linear-gradient(90deg,var(--accent),#72eba1)}
      .fcProActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .fcProActions button{flex:1;min-width:145px}
      @media(max-width:520px){.fcProGrid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function getWeekWorkouts(s) {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setHours(0,0,0,0);
    monday.setDate(now.getDate()-day+1);
    return s.workouts.filter(w => new Date(w.date) >= monday);
  }

  function recoveryScore(entry) {
    if (!entry) return null;
    const sleep = clamp(Number(entry.sleep ?? entry.hours ?? 0)/8*100,0,100);
    const energy = clamp(Number(entry.energy ?? 3)/5*100,0,100);
    const stress = 100-clamp((Number(entry.stress ?? 3)-1)/4*100,0,100);
    const soreness = 100-clamp(Number(entry.soreness ?? 1)/5*100,0,100);
    return Math.round(sleep*.35+energy*.30+stress*.20+soreness*.15);
  }

  function nutritionAdherence(s) {
    const target = Number(s.targets.protein)||0;
    if (!target) return {pct:0,days:0};
    const cutoff = startOfDaysAgo(6);
    const byDay = {};
    s.meals.filter(m => new Date(m.date) >= cutoff).forEach(m => {
      const key = dayKey(m.date);
      byDay[key] = (byDay[key]||0) + Number(m.p ?? m.protein ?? 0);
    });
    const values = Object.values(byDay);
    if (!values.length) return {pct:0,days:0};
    const pct = Math.round(mean(values.map(v => clamp(v/target*100,0,120))));
    return {pct,days:values.length};
  }

  function weightTrend(s) {
    const points = s.metrics.filter(m => Number(m.weight)>0)
      .map(m => ({date:new Date(m.date), weight:Number(m.weight)}))
      .sort((a,b)=>a.date-b.date);
    if (points.length < 2) return {delta:null, latest:points.at(-1)?.weight ?? null};
    const recent = points.filter(p => p.date >= startOfDaysAgo(30));
    const use = recent.length >= 2 ? recent : points.slice(-6);
    const delta = use.at(-1).weight - use[0].weight;
    return {delta, latest:use.at(-1).weight};
  }

  function prs(s) {
    const best = new Map();
    s.workouts.forEach(w => (w.exercises||[]).forEach(ex => {
      (ex.sets||[]).forEach(set => {
        const kg = Number(set.kg)||0, reps = Number(set.reps)||0;
        if (!kg || !reps) return;
        const e1rm = kg * (1 + reps/30);
        const prev = best.get(ex.name);
        if (!prev || e1rm > prev.e1rm) best.set(ex.name,{name:ex.name,e1rm,kg,reps,date:w.date});
      });
    }));
    return [...best.values()].sort((a,b)=>b.e1rm-a.e1rm).slice(0,6);
  }

  function dataHealth() {
    const important = ['profile','settings','targets','routines','workouts','meals','metrics','recovery','preferences'];
    let valid = 0, bytes = 0;
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      bytes += (k.length+v.length)*2;
    }
    important.forEach(k => {
      try {
        if (localStorage.getItem(k) !== null) {
          JSON.parse(localStorage.getItem(k));
          valid++;
        }
      } catch {}
    });
    return {valid,total:important.length,mb:bytes/1024/1024};
  }

  function advice(s) {
    const week = getWeekWorkouts(s);
    const goal = Number(s.settings.weeklySessionGoal)||4;
    const latestRecovery = s.recovery.at(-1);
    const readiness = recoveryScore(latestRecovery);
    const protein = nutritionAdherence(s);
    const trend = weightTrend(s);

    const tips = [];
    if (readiness !== null && readiness < 55) tips.push('Recuperación baja: evita perseguir récords hoy y mantén 2-4 RIR.');
    if (week.length < goal && new Date().getDay() >= 4) tips.push(`Llevas ${week.length}/${goal} sesiones: prioriza completar el volumen esencial antes de añadir extras.`);
    if (protein.days >= 2 && protein.pct < 85) tips.push(`Proteína media en ${protein.pct}% del objetivo: repartir 3-5 tomas facilita alcanzar el total.`);
    if (trend.delta !== null && Math.abs(trend.delta) > 2.5) tips.push('El peso ha cambiado rápido en el periodo reciente: revisa calorías, hidratación y consistencia antes de ajustar el plan.');
    if (!tips.length) tips.push('Las señales registradas son compatibles con mantener el plan y progresar de forma conservadora.');
    return tips.slice(0,3);
  }

  function insertAfter(anchor, node) {
    if (!anchor?.parentNode) return;
    anchor.parentNode.insertBefore(node, anchor.nextSibling);
  }

  function ensureHome() {
    if ($('fcCoach360')) return;
    const home = $('home');
    if (!home) return;
    const title = document.createElement('h2');
    title.id = 'fcCoach360Title';
    title.textContent = 'Coach 360';
    const card = document.createElement('div');
    card.id = 'fcCoach360';
    card.className = 'card';
    const anchor = $('homeCoach')?.parentElement || home.querySelector('.hero');
    insertAfter(anchor, title);
    insertAfter(title, card);
  }

  function ensureProgress() {
    if ($('fcPerformance')) return;
    const page = $('progress');
    if (!page) return;
    const title = document.createElement('h2');
    title.textContent = 'Rendimiento y récords';
    const card = document.createElement('div');
    card.id = 'fcPerformance';
    card.className = 'card';
    page.appendChild(title);
    page.appendChild(card);
  }

  function ensureSettings() {
    if ($('fcDataHealth')) return;
    const page = $('settings');
    if (!page) return;
    const title = document.createElement('h2');
    title.textContent = 'Salud de datos';
    const card = document.createElement('div');
    card.id = 'fcDataHealth';
    card.className = 'card';
    page.appendChild(title);
    page.appendChild(card);
  }

  function renderHome() {
    const target = $('fcCoach360');
    if (!target) return;
    const s = state();
    const week = getWeekWorkouts(s);
    const goal = Number(s.settings.weeklySessionGoal)||4;
    const protein = nutritionAdherence(s);
    const trend = weightTrend(s);
    const readiness = recoveryScore(s.recovery.at(-1));
    const adherence = Math.round(clamp(week.length/goal*100,0,100));
    const tips = advice(s);

    target.innerHTML = `
      <div class="fcProGrid">
        <div class="fcProStat"><div class="fcProValue">${week.length}/${goal}</div><div class="fcProLabel">sesiones esta semana</div><div class="fcProBar"><div style="width:${adherence}%"></div></div></div>
        <div class="fcProStat"><div class="fcProValue">${readiness ?? '—'}</div><div class="fcProLabel">readiness actual</div></div>
        <div class="fcProStat"><div class="fcProValue">${protein.days ? protein.pct+'%' : '—'}</div><div class="fcProLabel">proteína · media reciente</div></div>
        <div class="fcProStat"><div class="fcProValue">${trend.delta===null ? '—' : `${trend.delta>=0?'+':''}${trend.delta.toFixed(1)} kg`}</div><div class="fcProLabel">tendencia de peso</div></div>
      </div>
      <div class="fcProList">${tips.map((t,i)=>`<div class="fcProAdvice ${i===0&&readiness!==null&&readiness<55?'fcProWarn':''}">${esc(t)}</div>`).join('')}</div>
    `;
  }

  function renderPerformance() {
    const target = $('fcPerformance');
    if (!target) return;
    const s = state();
    const list = prs(s);
    if (!list.length) {
      target.innerHTML = '<div class="empty">Registra peso y repeticiones para calcular récords estimados.</div>';
      return;
    }
    target.innerHTML = `
      <div class="small">Mejores marcas estimadas mediante Epley. Úsalas para seguir tendencia, no como sustituto de un 1RM real.</div>
      <div class="fcProList">
        ${list.map(p=>`<div class="fcProItem"><div><strong>${esc(p.name)}</strong><div class="small">${p.kg} kg × ${p.reps} · ${new Date(p.date).toLocaleDateString('es-ES')}</div></div><strong>${Math.round(p.e1rm)} kg e1RM</strong></div>`).join('')}
      </div>`;
  }

  function backupNow() {
    const keys = {};
    for (let i=0;i<localStorage.length;i++) {
      const k = localStorage.key(i);
      keys[k] = localStorage.getItem(k);
    }
    const payload = {
      app:'FitCoach',
      exportedAt:new Date().toISOString(),
      format:'localStorage-safe-backup-v1',
      data:keys
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitcoach-backup-pro-${dayKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    localStorage.setItem('fcLastProBackup', JSON.stringify(new Date().toISOString()));
    renderDataHealth();
  }

  function renderDataHealth() {
    const target = $('fcDataHealth');
    if (!target) return;
    const health = dataHealth();
    const last = read('fcLastProBackup', null);
    const lastText = last ? new Date(last).toLocaleString('es-ES') : 'Nunca';
    const pct = Math.round(health.valid/health.total*100);
    target.innerHTML = `
      <div class="fcProGrid">
        <div class="fcProStat"><div class="fcProValue">${pct}%</div><div class="fcProLabel">estructuras válidas</div></div>
        <div class="fcProStat"><div class="fcProValue">${health.mb.toFixed(2)} MB</div><div class="fcProLabel">uso local estimado</div></div>
      </div>
      <div class="small" style="margin-top:10px">Última copia Pro: ${esc(lastText)}</div>
      <div class="fcProActions"><button id="fcBackupNow" type="button">Crear copia segura ahora</button><button id="fcRefreshPro" class="secondary" type="button">Recalcular paneles</button></div>
    `;
    $('fcBackupNow')?.addEventListener('click', backupNow);
    $('fcRefreshPro')?.addEventListener('click', renderAll);
  }

  function renderAll() {
    ensureHome(); ensureProgress(); ensureSettings();
    renderHome(); renderPerformance(); renderDataHealth();
  }

  function init() {
    injectStyle();
    renderAll();
    document.addEventListener('click', e => {
      if (e.target.closest('nav button,[data-go],#saveWorkout,#saveMetric,#saveRecovery,#calculateMacros,#saveSettings')) {
        setTimeout(renderAll, 120);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') renderAll();
    });
    window.addEventListener('storage', renderAll);
    window.FitCoachPro = {render:renderAll,version:'2026.08.09'};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
