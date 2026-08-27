import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkoutSession } from '../../domain/models';
import type { GeneratedExercise, GeneratedWorkout } from '../../domain/training/planGenerator';
import { localDate, saveSession } from '../../data/localRepository';
import { clearWorkoutDraft, hasDraftContent, loadWorkoutDraft, saveWorkoutDraft, type WorkoutDraftSet } from '../../data/workoutDraft';
import { formatPreviousSet, summarizeExerciseHistory } from '../../domain/training/history';

type DraftSet = WorkoutDraftSet;

function blankDrafts(workout: GeneratedWorkout): Record<string, DraftSet[]> {
  return Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, Array.from({ length: exercise.sets }, () => ({ kg: '', reps: '', rir: '' }))]));
}

function initialState(workout: GeneratedWorkout) {
  const today = localDate();
  const recovered = loadWorkoutDraft(workout.id, today);
  return { values: recovered?.values ?? blankDrafts(workout), startedAt: recovered?.startedAt ?? new Date().toISOString(), recovered: Boolean(recovered) };
}

function formatTimer(seconds: number): string {
  const safe = Math.max(0, seconds); const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function adaptedRecommendation(message: string, suggestedKg: number | null, loadAdjustmentPercent: number): string {
  if (!loadAdjustmentPercent || suggestedKg === null) return message;
  const adjusted = Math.round((suggestedKg * (1 + loadAdjustmentPercent / 100)) / 2.5) * 2.5;
  const sign = loadAdjustmentPercent > 0 ? '+' : '';
  return `${message} Adaptación semanal activa (${sign}${loadAdjustmentPercent}%): referencia ${adjusted} kg.`;
}

export function Training({ workout, sessions, onSaved, loadAdjustmentPercent = 0 }: { workout: GeneratedWorkout; sessions: WorkoutSession[]; onSaved: () => void; loadAdjustmentPercent?: number }) {
  const initial = useRef(initialState(workout)).current;
  const [values, setValues] = useState<Record<string, DraftSet[]>>(initial.values);
  const [startedAt] = useState(initial.startedAt);
  const [recovered] = useState(initial.recovered);
  const [error, setError] = useState('');
  const [restRemaining, setRestRemaining] = useState(0);
  const [restLabel, setRestLabel] = useState('');

  const summaries = useMemo(() => Object.fromEntries(workout.exercises.map((exercise) => [
    exercise.id, summarizeExerciseHistory({ sessions, exerciseId: exercise.id, repsMin: exercise.repsMin, repsMax: exercise.repsMax }),
  ])), [sessions, workout]);

  useEffect(() => {
    if (!hasDraftContent(values)) { clearWorkoutDraft(); return; }
    saveWorkoutDraft({ version: 1, workoutId: workout.id, localDate: localDate(), startedAt, savedAt: new Date().toISOString(), values });
  }, [values, startedAt, workout.id]);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => setRestRemaining(current => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining > 0]);

  const update = (exerciseId: string, setIndex: number, key: keyof DraftSet, value: string) => setValues(current => ({ ...current, [exerciseId]: current[exerciseId].map((set, index) => index === setIndex ? { ...set, [key]: value } : set) }));
  const addSet = (exerciseId: string) => setValues(current => ({ ...current, [exerciseId]: [...current[exerciseId], { kg: '', reps: '', rir: '' }] }));
  const removeSet = (exerciseId: string, setIndex: number) => setValues(current => ({ ...current, [exerciseId]: current[exerciseId].length <= 1 ? current[exerciseId] : current[exerciseId].filter((_, index) => index !== setIndex) }));

  const completeSet = (exercise: GeneratedExercise, setIndex: number) => {
    const set = values[exercise.id][setIndex];
    if (!set || set.reps === '' || !Number.isFinite(Number(set.reps)) || Number(set.reps) <= 0) { setError('Introduce las repeticiones de la serie antes de completarla.'); return; }
    setError(''); setRestLabel(`${exercise.name} · serie ${setIndex + 1}`); setRestRemaining(exercise.restSeconds);
  };

  const finish = () => {
    const now = new Date().toISOString();
    const session: WorkoutSession = {
      id: crypto.randomUUID(), plannedWorkoutId: workout.id, localDate: localDate(), startedAt, completedAt: now,
      exercises: workout.exercises.map(exercise => ({ exerciseId: exercise.id, sets: values[exercise.id].filter(set => set.reps !== '').map(set => ({ kg: Number(set.kg || 0), reps: Number(set.reps), rir: set.rir === '' ? null : Number(set.rir), completedAt: now })) })),
    };
    try { saveSession(session); clearWorkoutDraft(); setError(''); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la sesión.'); }
  };

  return <section>
    <p className="eyebrow">ENTRENAMIENTO ACTIVO</p><h1>{workout.title}</h1>
    <p className="secondary">{workout.minutes} min · {workout.exercises.length} ejercicios · registra al menos una serie válida</p>
    {loadAdjustmentPercent !== 0 && <div className="coach-inline" role="status"><strong>Microciclo adaptado</strong><span>Las recomendaciones de carga incorporan {loadAdjustmentPercent > 0 ? '+' : ''}{loadAdjustmentPercent}% aceptado en la revisión semanal.</span></div>}
    {recovered && <div className="coach-inline" role="status"><strong>Sesión recuperada</strong><span>Hemos restaurado tus series guardadas automáticamente.</span></div>}
    {restRemaining > 0 && <aside className="rest-timer" aria-live="polite"><div><span className="secondary">DESCANSO</span><strong>{formatTimer(restRemaining)}</strong><small>{restLabel}</small></div><div className="rest-actions"><button className="secondary-action" type="button" onClick={() => setRestRemaining(current => current + 30)}>+30 s</button><button className="secondary-action" type="button" onClick={() => setRestRemaining(0)}>Omitir</button></div></aside>}
    {workout.exercises.map(exercise => {
      const summary = summaries[exercise.id];
      const recommendation = adaptedRecommendation(summary.recommendation.message, summary.recommendation.suggestedKg, loadAdjustmentPercent);
      return <article className="exercise-card" key={exercise.id}>
        <h2>{exercise.name}</h2><p className="secondary">{exercise.sets} series · {exercise.repsMin}–{exercise.repsMax} reps · {exercise.rirMin}–{exercise.rirMax} RIR · {exercise.restSeconds}s descanso</p>
        <div className="coach-inline" role="note"><strong>Siguiente objetivo</strong><span>{recommendation}</span></div>
        <div className="set-table" role="group" aria-label={`Series de ${exercise.name}`}><div className="set-header" aria-hidden="true"><span>Serie</span><span>Anterior</span><span>Kg</span><span>Reps</span><span>RIR</span><span></span></div>
          {values[exercise.id].map((set, index) => <div className="set-row" key={index}><strong>{index + 1}</strong><span className="previous-set">{formatPreviousSet(summary.latestSets[index])}</span><input inputMode="decimal" placeholder="kg" aria-label={`${exercise.name} serie ${index + 1} kilos`} value={set.kg} onChange={event => update(exercise.id,index,'kg',event.target.value)} /><input inputMode="numeric" placeholder="reps" aria-label={`${exercise.name} serie ${index + 1} repeticiones`} value={set.reps} onChange={event => update(exercise.id,index,'reps',event.target.value)} /><input inputMode="numeric" placeholder="RIR" aria-label={`${exercise.name} serie ${index + 1} RIR`} value={set.rir} onChange={event => update(exercise.id,index,'rir',event.target.value)} /><div className="set-actions"><button className="icon-button small complete-set" type="button" aria-label={`Completar serie ${index + 1} de ${exercise.name}`} onClick={() => completeSet(exercise,index)}>✓</button><button className="icon-button small" type="button" aria-label={`Eliminar serie ${index + 1} de ${exercise.name}`} onClick={() => removeSet(exercise.id,index)}>−</button></div></div>)}
        </div><button className="secondary-action" type="button" onClick={() => addSet(exercise.id)}>+ Añadir serie</button>
      </article>;
    })}
    {error && <p className="error" role="alert">{error}</p>}<button className="primary-action" onClick={finish}>Finalizar y guardar</button>
  </section>;
}
