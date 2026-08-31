import type { Experience, Goal, UserProfile } from '../models';

export type GeneratedExercise = {
  id: string;
  name: string;
  pattern: 'push-horizontal' | 'push-vertical' | 'pull-horizontal' | 'pull-vertical' | 'squat' | 'hinge' | 'single-leg' | 'arms' | 'core' | 'calves';
  equipment: string[];
  minExperience: Experience;
  restrictionTags: string[];
  sets: number;
  repsMin: number;
  repsMax: number;
  rirMin: number;
  rirMax: number;
  restSeconds: number;
};

export type GeneratedWorkout = {
  id: string;
  title: string;
  minutes: number;
  exercises: GeneratedExercise[];
};

export type WeeklyTrainingSlot = {
  dayIndex: number;
  workout: GeneratedWorkout;
};

const rank: Record<Experience, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const ex = (id: string, name: string, pattern: GeneratedExercise['pattern'], equipment: string[], minExperience: Experience, restrictionTags: string[], sets: number, repsMin: number, repsMax: number, restSeconds: number): GeneratedExercise => ({
  id, name, pattern, equipment, minExperience, restrictionTags, sets, repsMin, repsMax, rirMin: 1, rirMax: 3, restSeconds,
});

export const exerciseLibrary: GeneratedExercise[] = [
  ex('bench-db','Press banca con mancuernas','push-horizontal',['gym','dumbbells'],'beginner',['shoulder'],3,6,10,120),
  ex('chest-machine','Press de pecho en máquina','push-horizontal',['gym','machine'],'beginner',[],3,8,12,90),
  ex('ohp-machine','Press de hombro en máquina','push-vertical',['gym','machine'],'beginner',['shoulder'],3,8,12,90),
  ex('row-chest','Remo con apoyo de pecho','pull-horizontal',['gym','dumbbells','machine'],'beginner',[],3,6,10,120),
  ex('lat-pulldown','Jalón al pecho','pull-vertical',['gym','cable'],'beginner',[],3,8,12,90),
  ex('leg-press','Prensa de piernas','squat',['gym','machine'],'beginner',['knee'],3,8,12,120),
  ex('goblet-squat','Sentadilla goblet','squat',['gym','dumbbells'],'beginner',['knee'],3,8,12,90),
  ex('rdl','Peso muerto rumano','hinge',['gym','barbell','dumbbells'],'intermediate',['lower-back'],3,6,10,120),
  ex('leg-curl','Curl femoral sentado','hinge',['gym','machine'],'beginner',[],3,10,15,75),
  ex('reverse-lunge','Zancada atrás','single-leg',['gym','dumbbells','bodyweight'],'intermediate',['knee'],2,8,12,90),
  ex('curl-cable','Curl de bíceps en polea','arms',['gym','cable'],'beginner',[],2,10,15,60),
  ex('triceps-cable','Extensión de tríceps en polea','arms',['gym','cable'],'beginner',[],2,10,15,60),
  ex('calf-press','Gemelo en prensa','calves',['gym','machine'],'beginner',[],2,10,15,60),
  ex('dead-bug','Dead bug','core',['bodyweight'],'beginner',[],2,8,12,45),
];

const strengthPatterns = new Set<GeneratedExercise['pattern']>(['push-horizontal','push-vertical','pull-horizontal','pull-vertical','squat','hinge']);
const isolationPatterns = new Set<GeneratedExercise['pattern']>(['arms','core','calves']);

function prescribeForGoal(exercise: GeneratedExercise, goal: Goal, experience: Experience): GeneratedExercise {
  const beginnerSets = experience === 'beginner' ? Math.min(exercise.sets, 2) : exercise.sets;
  if (goal === 'strength' && strengthPatterns.has(exercise.pattern)) {
    return {
      ...exercise,
      sets: experience === 'beginner' ? Math.min(3, beginnerSets + 1) : Math.min(4, beginnerSets + 1),
      repsMin: 3,
      repsMax: 6,
      rirMin: 1,
      rirMax: 3,
      restSeconds: Math.max(150, exercise.restSeconds),
    };
  }
  if (goal === 'strength' && isolationPatterns.has(exercise.pattern)) {
    return { ...exercise, sets: beginnerSets, repsMin: 8, repsMax: 12, restSeconds: Math.max(60, exercise.restSeconds) };
  }
  if (goal === 'fatloss') {
    return {
      ...exercise,
      sets: Math.max(2, beginnerSets - (experience === 'advanced' ? 0 : 1)),
      repsMin: Math.max(6, exercise.repsMin),
      repsMax: Math.max(10, exercise.repsMax),
      rirMin: 2,
      rirMax: 3,
    };
  }
  if (goal === 'hypertrophy' || goal === 'recomp') {
    const compound = !isolationPatterns.has(exercise.pattern);
    return {
      ...exercise,
      sets: beginnerSets,
      repsMin: compound ? Math.max(6, exercise.repsMin) : Math.max(10, exercise.repsMin),
      repsMax: compound ? Math.max(10, exercise.repsMax) : Math.max(15, exercise.repsMax),
      rirMin: 1,
      rirMax: 3,
    };
  }
  return { ...exercise, sets: beginnerSets };
}

function allowed(profile: UserProfile, exercise: GeneratedExercise) {
  if (rank[profile.experience] < rank[exercise.minExperience]) return false;
  const equipment = new Set(profile.equipment.map(item => item.toLowerCase()));
  const hasEquipment = exercise.equipment.some(item => item === 'bodyweight' || equipment.has(item) || equipment.has('gym'));
  if (!hasEquipment) return false;
  const restrictions = profile.restrictions.join(' ').toLowerCase();
  return !exercise.restrictionTags.some(tag => restrictions.includes(tag));
}

function choose(profile: UserProfile, pattern: GeneratedExercise['pattern']) {
  return exerciseLibrary.find(item => item.pattern === pattern && allowed(profile, item));
}

function workout(profile: UserProfile, id: string, title: string, patterns: GeneratedExercise['pattern'][]): GeneratedWorkout {
  const picked = patterns.map(pattern => choose(profile, pattern)).filter((item): item is GeneratedExercise => Boolean(item));
  const maxExercises = profile.sessionMinutes <= 40 ? 5 : profile.sessionMinutes <= 55 ? 6 : 7;
  const exercises = picked.slice(0, maxExercises).map(item => prescribeForGoal(item, profile.goal, profile.experience));
  return { id, title, minutes: profile.sessionMinutes, exercises };
}

export function defaultTrainingDays(daysRequested: number): number[] {
  const days = Math.max(2, Math.min(6, Math.round(daysRequested)));
  const defaults: Record<number, number[]> = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
  };
  return [...defaults[days]];
}

export function scheduleTrainingWeek(profile: UserProfile, plan = generateTrainingPlan(profile)): WeeklyTrainingSlot[] {
  if (!plan.length) return [];
  const requested = Math.max(2, Math.min(6, Math.round(profile.trainingDaysPerWeek)));
  const preferred = [...new Set((profile.preferredTrainingDays ?? []).filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
  const days = preferred.length === requested ? preferred : defaultTrainingDays(requested);
  return plan.slice(0, days.length).map((workoutItem, index) => ({ dayIndex: days[index], workout: workoutItem }));
}

export function generateTrainingPlan(profile: UserProfile): GeneratedWorkout[] {
  const days = Math.max(2, Math.min(6, Math.round(profile.trainingDaysPerWeek)));
  if (days <= 3) {
    const templates = [
      ['full-a','Full Body A',['squat','push-horizontal','pull-horizontal','hinge','core']],
      ['full-b','Full Body B',['hinge','push-vertical','pull-vertical','single-leg','arms']],
      ['full-c','Full Body C',['squat','push-horizontal','pull-vertical','calves','core']],
    ] as const;
    return templates.slice(0, days).map(([id,title,patterns]) => workout(profile,id,title,[...patterns]));
  }
  const templates = [
    ['upper-a','Torso A',['push-horizontal','pull-horizontal','push-vertical','pull-vertical','arms']],
    ['lower-a','Pierna A',['squat','hinge','single-leg','calves','core']],
    ['upper-b','Torso B',['pull-vertical','push-horizontal','pull-horizontal','push-vertical','arms']],
    ['lower-b','Pierna B',['hinge','squat','single-leg','calves','core']],
    ['upper-c','Torso C',['push-horizontal','pull-horizontal','pull-vertical','arms','core']],
    ['lower-c','Pierna C',['squat','hinge','single-leg','calves','core']],
  ] as const;
  return templates.slice(0, days).map(([id,title,patterns]) => workout(profile,id,title,[...patterns]));
}
