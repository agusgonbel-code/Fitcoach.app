import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../models';
import { generateTrainingPlan } from './planGenerator';

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
});
