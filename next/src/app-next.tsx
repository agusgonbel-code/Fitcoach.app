import React, { useMemo, useState } from 'react';
import type { FoodLogEntry, UserProfile } from './domain/models';
import { loadFoodLog, loadProfile, loadSessions, localDate, removeFoodEntry, saveFoodEntry, saveProfile } from './data/localRepository';
import { calculateNutrition } from './domain/nutrition/calculateTarget';
import { Training, workoutTemplate } from './features/training/Training';

type Tab = 'today' | 'training' | 'nutrition' | 'progress' | 'profile';

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['goal']>('recomp');
  const [sex, setSex] = useState<UserProfile['sex']>('male');
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState(1.45);
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(50);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Atleta',
      goal,
      experience: 'intermediate',
      sex,
      age,
      heightCm: height,
      weightKg: weight,
      activityMultiplier: activity,
      trainingDaysPerWeek: days,
      sessionMinutes: minutes,
      equipment: ['gym'],
      restrictions: [],
    };
    saveProfile(profile);
    onComplete(profile);
  };

  return <main className="app-shell onboarding">
    <p className="eyebrow">FITCOACH NEXT</p>
    <h1>Tu plan empieza contigo</h1>
    <p className="secondary">Usaremos estos datos para crear entrenamiento y objetivos nutricionales coherentes.</p>
    <form className="form-card" onSubmit={submit}>
      <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" /></label>
      <label>Objetivo<select value={goal} onChange={(event) => setGoal(event.target.value as UserProfile['goal'])}><option value="recomp">Recomposición</option><option value="hypertrophy">Ganancia muscular</option><option value="strength">Fuerza</option><option value="fatloss">Pérdida de grasa</option><option value="maintain">Mantenimiento</option></select></label>
      <div className="form-grid">
        <label>Sexo para cálculo<select value={sex} onChange={(event) => setSex(event.target.value as UserProfile['sex'])}><option value="male">Hombre</option><option value="female">Mujer</option></select></label>
        <label>Edad<input type="number" min="14" max="100" value={age} onChange={(event) => setAge(Number(event.target.value))} /></label>
        <label>Altura cm<input type="number" min="120" max="230" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label>
        <label>Peso kg<input type="number" min="35" max="350" step="0.1" value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></label>
      </div>
      <label>Actividad<select value={activity} onChange={(event) => setActivity(Number(event.target.value))}><option value="1.3">Baja</option><option value="1.45">Moderada</option><option value="1.6">Activa</option><option value="1.75">Muy activa</option></select></label>
      <div className="form-grid"><label>Días/semana<input type="number" min="2" max="6" value={days} onChange={(event) => setDays(Number(event.target.value))} /></label><label>Minutos<input type="number" min="30" max="90" step="5" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label></div>
      <button className="primary-action" type="submit">Crear mi plan</button>
    </form>
  </main>;
}

function Nutrition({ profile, log, onChange }: { profile: UserProfile; log: FoodLogEntry[]; onChange: () => void }) {
  const calculation = calculateNutrition(profile);
  const today = log.filter((item) => item.localDate === localDate());
  const totals = today.reduce((sum, item) => ({
    kcal: sum.kcal + item.kcal,
    proteinG: sum.proteinG + item.proteinG,
    carbsG: sum.carbsG + item.carbsG,
    fatG: sum.fatG + item.fatG,
  }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');

  const add = () => {
    const entry: FoodLogEntry = {
      id: crypto.randomUUID(), localDate: localDate(), name: name.trim(), kcal: Number(kcal),
      proteinG: Number(protein || 0), carbsG: Number(carbs || 0), fatG: Number(fat || 0), createdAt: new Date().toISOString(),
    };
    try {
      saveFoodEntry(entry);
      setName(''); setKcal(''); setProtein(''); setCarbs(''); setFat(''); setError(''); onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
    }
  };

  return <section>
    <p className="eyebrow">NUTRICIÓN</p><h1>Tu estrategia</h1>
    <div className="metric-grid"><article className="metric-card"><strong>{Math.round(totals.kcal)} / {calculation.target.kcal}</strong><span>kcal</span></article><article className="metric-card"><strong>{Math.round(totals.proteinG)} / {calculation.target.proteinG} g</strong><span>proteína</span></article></div>
    <p className="secondary">Objetivo calculado con Mifflin-St Jeor · TDEE estimado {calculation.tdee} kcal · ajuste {Math.round(calculation.adjustmentPct * 100)}%.</p>
    <div className="form-card"><h2>Añadir comida</h2><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. yogur con avena" /></label><div className="form-grid"><label>Kcal<input inputMode="numeric" value={kcal} onChange={(event) => setKcal(event.target.value)} /></label><label>Proteína g<input inputMode="decimal" value={protein} onChange={(event) => setProtein(event.target.value)} /></label><label>Carbos g<input inputMode="decimal" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label><label>Grasas g<input inputMode="decimal" value={fat} onChange={(event) => setFat(event.target.value)} /></label></div>{error && <p className="error" role="alert">{error}</p>}<button className="primary-action" onClick={add}>Guardar comida</button></div>
    {today.map((item) => <article className="exercise-card" key={item.id}><div className="hero-row"><div><h2>{item.name}</h2><p className="secondary">{Math.round(item.kcal)} kcal · {Math.round(item.proteinG)}P · {Math.round(item.carbsG)}C · {Math.round(item.fatG)}G</p></div><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => { removeFoodEntry(item.id); onChange(); }}>×</button></div></article>)}
  </section>;
}

export default function AppNext() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
  const [tab, setTab] = useState<Tab>('today');
  const [sessions, setSessions] = useState(() => loadSessions());
  const [foodLog, setFoodLog] = useState(() => loadFoodLog());
  const completedToday = sessions.filter((session) => session.localDate === localDate()).length;
  const totalSets = useMemo(() => sessions.reduce((count, session) => count + session.exercises.reduce((exerciseCount, exercise) => exerciseCount + exercise.sets.length, 0), 0), [sessions]);

  if (!profile) return <Onboarding onComplete={setProfile} />;

  const nutrition = calculateNutrition(profile);
  const todayFood = foodLog.filter((item) => item.localDate === localDate());
  const consumed = todayFood.reduce((sum, item) => ({ kcal: sum.kcal + item.kcal, protein: sum.protein + item.proteinG }), { kcal: 0, protein: 0 });
  const saved = () => { setSessions(loadSessions()); setTab('progress'); };
  const refreshFood = () => setFoodLog(loadFoodLog());

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">{tab === 'today' ? 'HOY' : tab.toUpperCase()}</p><h1>{tab === 'today' ? `Hola, ${profile.name}` : 'FitCoach'}</h1></div><button className="icon-button" aria-label="Abrir perfil" onClick={() => setTab('profile')}>{profile.name.slice(0, 2).toUpperCase()}</button></header>

    {tab === 'today' && <>
      <section className="hero-card"><p className="eyebrow">TU ENTRENAMIENTO</p><div className="hero-row"><div><h2>{workoutTemplate.title}</h2><p>{workoutTemplate.minutes} min · {workoutTemplate.exercises.length} ejercicios · {workoutTemplate.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} series</p></div><span className="status-pill">{completedToday ? 'Hecho' : 'Listo'}</span></div><button className="primary-action" onClick={() => setTab('training')}>{completedToday ? 'Ver entrenamiento' : 'Empezar entrenamiento'}</button></section>
      <section className="section-block"><div className="section-heading"><h2>Nutrición</h2><span>{Math.max(0, nutrition.target.kcal - Math.round(consumed.kcal))} kcal restantes</span></div><div className="metric-grid"><article className="metric-card"><strong>{Math.round(consumed.kcal)} / {nutrition.target.kcal}</strong><span>kcal</span></article><article className="metric-card"><strong>{Math.round(consumed.protein)} / {nutrition.target.proteinG} g</strong><span>proteína</span></article></div><button className="secondary-action" onClick={() => setTab('nutrition')}>Registrar comida</button></section>
      <section className="coach-card"><p className="eyebrow">COACH</p><h2>Siguiente mejor acción</h2><p>{completedToday ? 'Sesión registrada. Revisa tu progreso y completa tus objetivos nutricionales.' : 'En Entrenar verás el rendimiento anterior y una recomendación de carga basada en tu historial real.'}</p></section>
    </>}

    {tab === 'training' && <Training sessions={sessions} onSaved={saved} />}
    {tab === 'progress' && <section><p className="eyebrow">PROGRESO</p><h1>Tu evolución</h1><div className="metric-grid"><article className="metric-card"><strong>{sessions.length}</strong><span>sesiones</span></article><article className="metric-card"><strong>{totalSets}</strong><span>series registradas</span></article></div><p className="secondary">Estos datos proceden de sesiones guardadas localmente en FitCoach Next.</p></section>}
    {tab === 'nutrition' && <Nutrition profile={profile} log={foodLog} onChange={refreshFood} />}
    {tab === 'profile' && <section><p className="eyebrow">PERFIL</p><h1>{profile.name}</h1><div className="form-card"><p><strong>Objetivo:</strong> {profile.goal}</p><p><strong>Entrenamiento:</strong> {profile.trainingDaysPerWeek} días · {profile.sessionMinutes} min</p><p><strong>Nutrición:</strong> {nutrition.target.kcal} kcal · {nutrition.target.proteinG}P · {nutrition.target.carbsG}C · {nutrition.target.fatG}G</p></div></section>}

    <nav className="tabbar" aria-label="Navegación principal">{([['today', 'Hoy'], ['training', 'Entrenar'], ['nutrition', 'Nutrición'], ['progress', 'Progreso'], ['profile', 'Perfil']] as [Tab, string][]).map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
  </main>;
}
