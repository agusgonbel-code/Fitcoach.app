export type Goal = 'hypertrophy' | 'recomp' | 'strength' | 'fatloss' | 'maintain';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Sex = 'male' | 'female';

export interface UserProfile {
  id: string;
  name: string;
  goal: Goal;
  experience: Experience;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  activityMultiplier: number;
  trainingDaysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  restrictions: string[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  movementPattern: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  stability: 'low' | 'medium' | 'high';
  skillLevel: Experience;
  unilateral: boolean;
}

export interface SetPrescription {
  repsMin: number;
  repsMax: number;
  targetRirMin: number;
  targetRirMax: number;
  restSeconds: number;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: SetPrescription[];
}

export interface PlannedWorkout {
  id: string;
  title: string;
  estimatedMinutes: number;
  exercises: PlannedExercise[];
}

export interface PerformedSet {
  kg: number;
  reps: number;
  rir: number | null;
  completedAt: string;
}

export interface ExercisePerformance {
  exerciseId: string;
  sets: PerformedSet[];
}

export interface WorkoutSession {
  id: string;
  plannedWorkoutId: string;
  localDate: string;
  startedAt: string;
  completedAt?: string;
  exercises: ExercisePerformance[];
  notes?: string;
}

export interface NutritionTarget {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionCalculation {
  equation: 'mifflin-st-jeor';
  bmr: number;
  tdee: number;
  adjustmentPct: number;
  target: NutritionTarget;
}

export interface FoodLogEntry {
  id: string;
  localDate: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: string;
}

export interface BodyMetric {
  id: string;
  localDate: string;
  weightKg: number;
  waistCm?: number;
  bodyFatPct?: number;
  createdAt: string;
}

export interface CoachInsight {
  id: string;
  title: string;
  observation: string;
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
  actionLabel?: string;
}
