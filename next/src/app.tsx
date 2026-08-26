import React, { useMemo, useState } from 'react';
import type { UserProfile, WorkoutSession } from './domain/models';
import { loadProfile, loadSessions, localDate, saveProfile, saveSession } from './data/localRepository';

type Tab = 'today' | 'training' | 'nutrition' | 'progress' | 'profile';

const workoutTemplate = {
  id: 'upper-a', title: 'Torso A', minutes: 47,
  exercises: [
    { id: 'bench-db', name: 'Press banca con mancuernas', reps: '6–10', rir: '1–3' },
    { id: 'row-chest', name: 'Remo con apoyo de pecho', reps: '6–10', rir: '1–3' },
    { id: 'lat-pulldown', name: 'Jalón al pecho', reps: '8–12', rir: '1–3' }
  ]
};

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['goal']>('recomp');
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(50);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const profile: UserProfile = { id: crypto.randomUUID(), name: name.trim() || 'Atleta', goal, experience: 'intermediate', age: 35, heightCm: 170, weightKg: 70, trainingDaysPerWeek: days, sessionMinutes: minutes, equipment: ['gym'], restrictions: [] };
    saveProfile(profile); onComplete(profile);
  };
  return <main className="app-shell onboarding"><p className="eyebrow">FITCOACH NEXT</p><h1>Tu plan empieza contigo</h1><p className="secondary">Configura lo esencial ahora. Podrás afinar el resto después.</p><form className="form-card" onSubmit={submit}><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" /></label><label>Objetivo<select value={goal} onChange={e=>setGoal(e.target.value as UserProfile['goal'])}><option value="recomp">Recomposición</option><option value="hypertrophy">Ganancia muscular</option><option value="strength">Fuerza</option><option value="fatloss">Pérdida de grasa</option></select></label><div className="form-grid"><label>Días/semana<input type="number" min="2" max="6" value={days} onChange={e=>setDays(Number(e.target.value))} /></label><label>Minutos<input type="number" min="30" max="90" step="5" value={minutes} onChange={e=>setMinutes(Number(e.target.value))} /></label></div><button className="primary-action" type="submit">Crear mi plan</button></form></main>;
}

function Training({ onSaved }: { onSaved: () => void }) {
  const [values, setValues] = useState<Record<string,{kg:string;reps:string;rir:string}>>({});
  const [error, setError] = useState('');
  const update=(id:string,key:'kg'|'reps'|'rir',value:string)=>setValues(v=>({...v,[id]:{kg:'',reps:'',rir:'',...v[id],[key]:value}}));
  const finish=()=>{
    const startedAt=new Date().toISOString();
    const session: WorkoutSession={id:crypto.randomUUID(),plannedWorkoutId:workoutTemplate.id,localDate:localDate(),startedAt,completedAt:new Date().toISOString(),exercises:workoutTemplate.exercises.map(ex=>{const v=values[ex.id];return {exerciseId:ex.id,sets:v&&v.reps!==''?[{kg:Number(v.kg||0),reps:Number(v.reps),rir:v.rir===''?null:Number(v.rir),completedAt:new Date().toISOString()}]:[]};})};
    try{saveSession(session);setError('');onSaved();}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la sesión.');}
  };
  return <section><p className="eyebrow">ENTRENAMIENTO ACTIVO</p><h1>{workoutTemplate.title}</h1><p className="secondary">{workoutTemplate.minutes} min · registra al menos una serie válida</p>{workoutTemplate.exercises.map(ex=><article className="exercise-card" key={ex.id}><h2>{ex.name}</h2><p className="secondary">Objetivo {ex.reps} reps · {ex.rir} RIR</p><div className="set-grid"><input inputMode="decimal" placeholder="kg" aria-label={`${ex.name} kilos`} value={values[ex.id]?.kg??''} onChange={e=>update(ex.id,'kg',e.target.value)} /><input inputMode="numeric" placeholder="reps" aria-label={`${ex.name} repeticiones`} value={values[ex.id]?.reps??''} onChange={e=>update(ex.id,'reps',e.target.value)} /><input inputMode="numeric" placeholder="RIR" aria-label={`${ex.name} RIR`} value={values[ex.id]?.rir??''} onChange={e=>update(ex.id,'rir',e.target.value)} /></div></article>)}{error&&<p className="error" role="alert">{error}</p>}<button className="primary-action" onClick={finish}>Finalizar y guardar</button></section>;
}

export default function App(){
  const [profile,setProfile]=useState<UserProfile|null>(()=>loadProfile());
  const [tab,setTab]=useState<Tab>('today');
  const [sessions,setSessions]=useState(()=>loadSessions());
  const completedToday=sessions.filter(s=>s.localDate===localDate()).length;
  const totalSets=useMemo(()=>sessions.reduce((n,s)=>n+s.exercises.reduce((m,e)=>m+e.sets.length,0),0),[sessions]);
  if(!profile)return <Onboarding onComplete={setProfile}/>;
  const saved=()=>{setSessions(loadSessions());setTab('progress');};
  return <main className="app-shell"><header className="topbar"><div><p className="eyebrow">{tab==='today'?'HOY':tab.toUpperCase()}</p><h1>{tab==='today'?`Hola, ${profile.name}`:'FitCoach'}</h1></div><button className="icon-button" aria-label="Abrir perfil" onClick={()=>setTab('profile')}>{profile.name.slice(0,2).toUpperCase()}</button></header>
  {tab==='today'&&<><section className="hero-card"><p className="eyebrow">TU ENTRENAMIENTO</p><div className="hero-row"><div><h2>{workoutTemplate.title}</h2><p>{workoutTemplate.minutes} min · {workoutTemplate.exercises.length} ejercicios</p></div><span className="status-pill">{completedToday?'Hecho':'Listo'}</span></div><button className="primary-action" onClick={()=>setTab('training')}>{completedToday?'Ver entrenamiento':'Empezar entrenamiento'}</button></section><section className="section-block"><div className="section-heading"><h2>Nutrición</h2><span>Objetivos pendientes</span></div><p className="secondary">El motor nutricional se conectará al perfil en el siguiente bloque.</p></section><section className="coach-card"><p className="eyebrow">COACH</p><h2>Siguiente mejor acción</h2><p>{completedToday?'Sesión registrada. Revisa tu progreso y recupera para la siguiente sesión.':'Completa el entrenamiento de hoy y registra RIR para que FitCoach pueda adaptar la progresión.'}</p></section></>}
  {tab==='training'&&<Training onSaved={saved}/>} 
  {tab==='progress'&&<section><p className="eyebrow">PROGRESO</p><h1>Tu evolución</h1><div className="metric-grid"><article className="metric-card"><strong>{sessions.length}</strong><span>sesiones</span></article><article className="metric-card"><strong>{totalSets}</strong><span>series registradas</span></article></div><p className="secondary">Estos datos proceden de sesiones guardadas localmente en FitCoach Next.</p></section>}
  {tab==='nutrition'&&<section><p className="eyebrow">NUTRICIÓN</p><h1>Tu estrategia</h1><p className="secondary">Próximo bloque de implementación: objetivos, comidas, recetas y menú conectados al perfil.</p></section>}
  {tab==='profile'&&<section><p className="eyebrow">PERFIL</p><h1>{profile.name}</h1><div className="form-card"><p><strong>Objetivo:</strong> {profile.goal}</p><p><strong>Entrenamiento:</strong> {profile.trainingDaysPerWeek} días · {profile.sessionMinutes} min</p></div></section>}
  <nav className="tabbar" aria-label="Navegación principal">{([['today','Hoy'],['training','Entrenar'],['nutrition','Nutrición'],['progress','Progreso'],['profile','Perfil']] as [Tab,string][]).map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</nav></main>;
}
