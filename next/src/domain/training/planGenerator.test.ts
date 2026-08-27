import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../models';
import { defaultTrainingDays, generateTrainingPlan, scheduleTrainingWeek } from './planGenerator';

const base: UserProfile = {
  id: 'u1', name: 'Test', goal: 'recomp', experience: 'intermediate', sex: 'male', age: 35,
  heightCm: 180, weightKg: 80, activityMultiplier: 1.45, trainingDaysPerWeek: 4, sessionMinutes: 50,
  equipment: ['gym'], restrictions: [],
};

describe('generateTrainingPlan', () => {
  it('respects requested training days and session duration', () => {
    const plan = generateTrainingPlan({ ...base, trainingDaysPerWeek: 5, sessionMinutes: 40 });
    expect(plan).toHaveLength(5);
    expect(plan.every(day => day.minutes === 40)).toBe(true);
    expect(plan.every(day => day.exercises.length <= 5)).toBe(true);
  });

  it('uses full body layouts for two or three training days', () => {
    const plan = generateTrainingPlan({ ...base, trainingDaysPerWeek: 3 });
    expect(plan).toHaveLength(3);
    expect(plan.every(day => day.title.startsWith('Full Body'))).toBe(true);
  });

  it('reduces set count for beginners', () => {
    const plan = generateTrainingPlan({ ...base, experience: 'beginner' });
    expect(plan.flatMap(day => day.exercises).every(exercise => exercise.sets <= 2)).toBe(true);
  });

  it('filters exercises tagged by user restrictions', () => {
    const plan = generateTrainingPlan({ ...base, restrictions: ['knee pain'] });
    const ids = plan.flatMap(day => day.exercises.map(exercise => exercise.id));
    expect(ids).not.toContain('leg-press');
    expect(ids).not.toContain('goblet-squat');
    expect(ids).not.toContain('reverse-lunge');
  });

  it('never exceeds six days', () => {
    expect(generateTrainingPlan({ ...base, trainingDaysPerWeek: 10 })).toHaveLength(6);
  });

  it('prescribes lower reps and longer rests for strength compounds', () => {
    const plan = generateTrainingPlan({ ...base, goal: 'strength' });
    const bench = plan.flatMap(day => day.exercises).find(exercise => exercise.id === 'bench-db');
    expect(bench).toBeDefined();
    expect(bench?.repsMin).toBe(3);
    expect(bench?.repsMax).toBe(6);
    expect(bench?.restSeconds).toBeGreaterThanOrEqual(150);
    expect(bench?.sets).toBe(4);
  });

  it('keeps hypertrophy work in moderate rep ranges', () => {
    const plan = generateTrainingPlan({ ...base, goal: 'hypertrophy' });
    const bench = plan.flatMap(day => day.exercises).find(exercise => exercise.id === 'bench-db');
    const curl = plan.flatMap(day => day.exercises).find(exercise => exercise.id === 'curl-cable');
    expect(bench?.repsMin).toBeGreaterThanOrEqual(6);
    expect(bench?.repsMax).toBeGreaterThanOrEqual(10);
    expect(curl?.repsMin).toBeGreaterThanOrEqual(10);
  });

  it('uses a more conservative RIR target for fat loss', () => {
    const plan = generateTrainingPlan({ ...base, goal: 'fatloss' });
    expect(plan.flatMap(day => day.exercises).every(exercise => exercise.rirMin >= 2)).toBe(true);
  });
});

describe('weekly scheduling', () => {
  it('spreads default four-day training across the week', () => {
    expect(defaultTrainingDays(4)).toEqual([0, 1, 3, 4]);
  });

  it('uses the exact preferred weekdays when their count matches the plan', () => {
    const profile = { ...base, preferredTrainingDays: [1, 3, 5, 6] };
    const week = scheduleTrainingWeek(profile);
    expect(week.map(slot => slot.dayIndex)).toEqual([1, 3, 5, 6]);
    expect(week.map(slot => slot.workout.id)).toEqual(['upper-a', 'lower-a', 'upper-b', 'lower-b']);
  });

  it('falls back safely when preferred weekdays are invalid or incomplete', () => {
    const profile = { ...base, preferredTrainingDays: [0, 0, 9] };
    expect(scheduleTrainingWeek(profile).map(slot => slot.dayIndex)).toEqual([0, 1, 3, 4]);
  });
});
