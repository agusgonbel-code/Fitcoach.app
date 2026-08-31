import React, { useMemo, useState } from 'react';
import type { UserProfile } from './domain/models';
import { loadBodyMetrics, loadFoodLog, loadProfile, loadSessions, localDate, saveProfile } from './data/localRepository';
import { loadWorkoutDraft } from './data/workoutDraft';
import { activeAcceptedAdaptation, loadAdaptationDecision, saveAdaptationDecision, type AdaptationDecision } from './data/adaptationRepository';
import { calculateNutrition } from './domain/nutrition/calculateTarget';
import { summarizeProgress } from './domain/progress/summarizeProgress';
import { buildCoachInsight } from './domain/coach/buildInsight';
import { defaultTrainingDays, generateTrainingPlan, scheduleTrainingWeek } from './domain/training/planGenerator';
import { applyTrainingAdaptation, buildWeeklyTrainingAdaptation } from './domain/training/weeklyAdaptation';
import { Training } from './features/training/Training';
import { Nutrition as NutritionPlanner } from './features/nutrition/Nutrition';
import { BodyProgress } from './features/progress/BodyProgress';
import { AdaptationProposal } from './features/progress/AdaptationProposal';
import { BackupPanel } from './features/profile/BackupPanel';

type Tab = 'today' | 'training' | 'nutrition' | 'progress' | 'profile';
const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<UserProfile['goal']>('recomp');
  const [experience, setExperience] = useState<UserProfile['experience']>('intermediate');
  const [sex, setSex] = useState<UserProfile['sex']>('male');
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState(1.45);
  const [days, setDays] = useState(4);
  const [preferredDays, setPreferredDays] = useState<number[]>(() => defaultTrainingDays(4));
  const [minutes, setMinutes] = useState(50);
  const [equipment, setEquipment] = useState('gym');
  const [restrictions, setRestrictions] = useState('');

  const changeTrainingDays = (value: number) => {
    const normalized = Math.max(2, Math.min(6, Math.round(value || 2)));
    setDays(normalized); setPreferredDays(defaultTrainingDays(normalized));
  };
  const togglePreferredDay = (day: number) => {
    setPreferredDays(current => {
      if (current.includes(day)) return current.filter(item => item !== day);
      if (current.length >= days) return current;
      return [...current, day].sort((a, b) => a - b);
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const profile: UserProfile = {
      id: crypto.randomUUID(), name: name.trim() || 'Atleta', goal, experience, sex, age, heightCm: height, weightKg: weight,
      activityMultiplier: activity, trainingDaysPerWeek: days, sessionMinutes: minutes,
      preferredTrainingDays: preferredDays.length === days ? preferredDays : defaultTrainingDays(days),
      equipment: equipment.split(',').map(item => item.trim().toLowerCase()).filter(Boolean),
      restrictions: restrictions.split(',').map(item => item.trim().toLowerCase()).filter(Boolean),
    };
    saveProfile(profile); onComplete(profile);
  };

  return <main className="app-shell onboarding">
    <p className="eyebrow">FITCOACH NEXT</p><h1>Tu plan empieza contigo</h1><p className="secondary">Usaremos estos datos para crear entrenamiento y objetivos nutricionales coherentes.</p>
    <form className="form-card" onSubmit={submit}>
      <label>Nombre<input value={name} onChange={event => setName(event.target.value)} placeholder="Tu nombre" /></label>
      <label>Objetivo<select value={goal} onChange={event => setGoal(event.target.value as UserProfile['goal'])}><option value="recomp">Recomposición</option><option value="hypertrophy">Ganancia muscular</option><option value="strength">Fuerza</option><option value="fatloss">Pérdida de grasa</option><option value="maintain">Mantenimiento</option></select></label>
      <label>Experiencia<select value={experience} onChange={event => setExperience(event.target.value as UserProfile['experience'])}><option value="beginner">Principiante</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option></select></label>
      <div className="form-grid"><label>Sexo para cálculo<select value={sex} onChange={event => setSex(event.target.value as UserProfile['sex'])}><option value="male">Hombre</option><option value="female">Mujer</option></select></label><label>Edad<input type="number" min="14" max="100" value={age} onChange={event => setAge(Number(event.target.value))} /></label><label>Altura cm<input type="number" min="120" max="230" value={height} onChange={event => setHeight(Number(event.target.value))} /></label><label>Peso kg<input type="number" min="35" max="350" step="0.1" value={weight} onChange={event => setWeight(Number(event.target.value))} /></label></div>
      <label>Actividad<select value={activity} onChange={event => setActivity(Number(event.target.value))}><option value="1.3">Baja</option><option value="1.45">Moderada</option><option value="1.6">Activa</option><option value="1.75">Muy activa</option></select></label>
      <div className="form-grid"><label>Días/semana<input type="number" min="2" max="6" value={days} onChange={event => changeTrainingDays(Number(event.target.value))} /></label><label>Minutos<input type="number" min="30" max="90" step="5" value={minutes} onChange={event => setMinutes(Number(event.target.value))} /></label></div>
      <fieldset className="form-card"><legend>Días preferidos · elige {days}</legend><div className="day-picker">{weekdayLabels.map((label, day) => <button key={label} type="button" className={preferredDays.includes(day) ? 'day-chip active' : 'day-chip'} aria-pressed={preferredDays.includes(day)} onClick={() => togglePreferredDay(day)}>{label}</button>)}</div><p className="secondary">{preferredDays.length === days ? 'Calendario listo.' : `Selecciona ${days - preferredDays.length} día(s) más.`}</p></fieldset>
      <label>Equipamiento<input value={equipment} onChange={event => setEquipment(event.target.value)} placeholder="gym o dumbbells, cable, machine" /></label>
      <label>Limitaciones<input value={restrictions} onChange={event => setRestrictions(event.target.value)} placeholder="Ej.: knee pain, shoulder" /></label>
      <button className="primary-action" type="submit">Crear mi plan</button>
    </form>
  </main>;
}

function AuthenticatedApp({ profile }: { profile: UserProfile }) {
  const [sessions, setSessions] = useState(() => loadSessions());
  const [foodLog, setFoodLog] = useState(() => loadFoodLog());
  const [bodyMetrics, setBodyMetrics] = useState(() => loadBodyMetrics());
  const [adaptationDecision, setAdaptationDecision] = useState<AdaptationDecision | null>(() => loadAdaptationDecision());
  const today = localDate();
  const nutrition = calculateNutrition(profile);
  const baseTrainingPlan = useMemo(() => generateTrainingPlan(profile), [profile]);
  const activeAdaptation = useMemo(() => activeAcceptedAdaptation(today), [adaptationDecision, today]);
  const trainingPlan = useMemo(() => activeAdaptation ? applyTrainingAdaptation(baseTrainingPlan, activeAdaptation) : baseTrainingPlan, [baseTrainingPlan, activeAdaptation]);
  const weeklySchedule = useMemo(() => scheduleTrainingWeek(profile, trainingPlan), [profile, trainingPlan]);
  const weekdayIndex = (new Date().getDay() + 6) % 7;
  const todaySlot = weeklySchedule.find(slot => slot.dayIndex === weekdayIndex);
  const todayWorkout = todaySlot?.workout ?? null;
  const [tab, setTab] = useState<Tab>(() => todayWorkout && loadWorkoutDraft(todayWorkout.id, today) ? 'training' : 'today');
  const completedToday = Boolean(todayWorkout && sessions.some(session => session.localDate === today && session.plannedWorkoutId === todayWorkout.id && Boolean(session.completedAt)));
  const progress = useMemo(() => summarizeProgress(profile, sessions, foodLog, nutrition.target, today), [profile, sessions, foodLog, nutrition.target.kcal, nutrition.target.proteinG, nutrition.target.carbsG, nutrition.target.fatG, today]);
  const insight = useMemo(() => buildCoachInsight(progress, completedToday), [progress, completedToday]);
  const adaptationProposal = useMemo(() => buildWeeklyTrainingAdaptation(progress), [progress]);
  const todayFood = foodLog.filter(item => item.localDate === today);
  const consumed = todayFood.reduce((sum, item) => ({ kcal: sum.kcal + item.kcal, protein: sum.protein + item.proteinG }), { kcal: 0, protein: 0 });
  const saved = () => { setSessions(loadSessions()); setTab('progress'); };
  const refreshFood = () => setFoodLog(loadFoodLog());
  const refreshBodyMetrics = () => setBodyMetrics(loadBodyMetrics());
  const decideAdaptation = (status: 'accepted' | 'declined') => setAdaptationDecision(saveAdaptationDecision(adaptationProposal, status, today));
  const routeCoachAction = () => {
    if (insight.actionLabel === 'Registrar comida' || insight.actionLabel === 'Ver nutrición') setTab('nutrition');
    else if (insight.actionLabel === 'Entrenar' || insight.actionLabel === 'Revisar entrenamiento' || insight.actionLabel === 'Ver plan') setTab('training');
    else setTab('progress');
  };

  return <main className="app-shell">
    <header className="topbar"><div><p className="eyebrow">{tab === 'today' ? 'HOY' : tab.toUpperCase()}</p><h1>{tab === 'today' ? `Hola, ${profile.name}` : 'FitCoach'}</h1></div><button className="icon-button" aria-label="Abrir perfil" onClick={() => setTab('profile')}>{profile.name.slice(0, 2).toUpperCase()}</button></header>
    {tab === 'today' && <><section className="hero-card"><p className="eyebrow">{todayWorkout ? 'TU ENTRENAMIENTO' : 'RECUPERACIÓN'}</p>{todayWorkout ? <><div className="hero-row"><div><h2>{todayWorkout.title}</h2><p>{todayWorkout.minutes} min · {todayWorkout.exercises.length} ejercicios · {todayWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} series</p></div><span className="status-pill">{completedToday ? 'Hecho' : 'Listo'}</span></div>{activeAdaptation && <div className="coach-inline" role="status"><strong>Plan adaptado</strong><span>Microciclo con revisión semanal aceptada.</span></div>}<button className="primary-action" onClick={() => setTab('training')}>{completedToday ? 'Ver entrenamiento' : 'Empezar entrenamiento'}</button></> : <><div className="hero-row"><div><h2>Día sin sesión programada</h2><p>Recupera y mantén tu nutrición. Tu calendario respeta los días elegidos.</p></div><span className="status-pill">Descanso</span></div><button className="secondary-action" onClick={() => setTab('training')}>Ver semana</button></>}</section><section className="section-block"><div className="section-heading"><h2>Nutrición</h2><span>{Math.max(0, nutrition.target.kcal - Math.round(consumed.kcal))} kcal restantes</span></div><div className="metric-grid"><article className="metric-card"><strong>{Math.round(consumed.kcal)} / {nutrition.target.kcal}</strong><span>kcal</span></article><article className="metric-card"><strong>{Math.round(consumed.protein)} / {nutrition.target.proteinG} g</strong><span>proteína</span></article></div><button className="secondary-action" onClick={() => setTab('nutrition')}>Registrar comida</button></section><section className="coach-card"><p className="eyebrow">COACH · {insight.confidence.toUpperCase()}</p><h2>{todayWorkout ? insight.title : 'Hoy toca recuperar'}</h2><p>{todayWorkout ? insight.observation : 'No hay sesión planificada para hoy según tus días preferidos.'}</p><p><strong>{todayWorkout ? insight.recommendation : 'Mantén actividad ligera si te apetece y llega recuperado a la próxima sesión.'}</strong></p>{todayWorkout && insight.actionLabel && <button className="secondary-action" onClick={routeCoachAction}>{insight.actionLabel}</button>}</section></>}
    {tab === 'training' && (todayWorkout ? <Training workout={todayWorkout} sessions={sessions} onSaved={saved} loadAdjustmentPercent={activeAdaptation?.loadPercent ?? 0} /> : <section><p className="eyebrow">PLAN SEMANAL</p><h1>Hoy es descanso</h1><p className="secondary">Tus sesiones se distribuyen solo en los días seleccionados.</p>{weeklySchedule.map(slot => <article className="exercise-card" key={slot.workout.id}><div className="hero-row"><div><h2>{weekdayLabels[slot.dayIndex]} · {slot.workout.title}</h2><p className="secondary">{slot.workout.minutes} min · {slot.workout.exercises.length} ejercicios</p></div><span className="status-pill">{slot.workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} series</span></div></article>)}</section>)}
    {tab === 'progress' && <section><p className="eyebrow">PROGRESO · ÚLTIMOS 7 DÍAS</p><h1>Tu evolución</h1><div className="metric-grid"><article className="metric-card"><strong>{progress.completedWorkouts7d} / {progress.plannedWorkouts7d}</strong><span>sesiones</span></article><article className="metric-card"><strong>{Math.round(progress.trainingAdherence * 100)}%</strong><span>adherencia</span></article><article className="metric-card"><strong>{progress.totalSets7d}</strong><span>series</span></article><article className="metric-card"><strong>{Math.round(progress.volumeLoad7d).toLocaleString('es-ES')}</strong><span>kg × reps</span></article></div><article className="coach-card"><p className="eyebrow">ESFUERZO</p><h2>{progress.averageRir7d === null ? 'Aún sin datos' : `${progress.averageRir7d.toFixed(1)} RIR medio`}</h2><p>{progress.averageRir7d === null ? 'Registra RIR en tus series para interpretar esfuerzo y fatiga.' : 'Calculado únicamente con series válidas de los últimos 7 días.'}</p></article><AdaptationProposal proposal={adaptationProposal} decision={adaptationDecision} onAccept={() => decideAdaptation('accepted')} onDecline={() => decideAdaptation('declined')} /><article className="coach-card"><p className="eyebrow">NUTRICIÓN</p><h2>{progress.nutritionAdherence === null ? 'Datos insuficientes' : `${Math.round(progress.nutritionAdherence * 100)}% adherencia energética`}</h2><p>{progress.nutritionLoggingDays7d} día(s) registrados. FitCoach exige al menos 4 días antes de juzgar adherencia nutricional.</p></article><BodyProgress metrics={bodyMetrics} onChange={refreshBodyMetrics} /></section>}
    {tab === 'nutrition' && <NutritionPlanner profile={profile} log={foodLog} onChange={refreshFood} />}
    {tab === 'profile' && <section><p className="eyebrow">PERFIL</p><h1>{profile.name}</h1><div className="form-card"><p><strong>Objetivo:</strong> {profile.goal}</p><p><strong>Entrenamiento:</strong> {profile.trainingDaysPerWeek} días · {profile.sessionMinutes} min · {trainingPlan.length} sesiones generadas</p><p><strong>Días:</strong> {weeklySchedule.map(slot => weekdayLabels[slot.dayIndex]).join(' · ')}</p><p><strong>Nutrición:</strong> {nutrition.target.kcal} kcal · {nutrition.target.proteinG}P · {nutrition.target.carbsG}C · {nutrition.target.fatG}G</p>{adaptationDecision?.status === 'accepted' && <p><strong>Próxima adaptación:</strong> {adaptationDecision.effectiveFrom}</p>}</div><BackupPanel /></section>}
    <nav className="tabbar" aria-label="Navegación principal">{([['today','Hoy'],['training','Entrenar'],['nutrition','Nutrición'],['progress','Progreso'],['profile','Perfil']] as [Tab,string][]).map(([id,label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
  </main>;
}

export default function AppNext() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile());
  if (!profile) return <Onboarding onComplete={setProfile} />;
  return <AuthenticatedApp profile={profile} />;
}
