import { describe, expect, it } from 'vitest';
import { summarizeProgress } from './summarizeProgress';
import type { FoodLogEntry, UserProfile, WorkoutSession } from '../models';

const profile: UserProfile = { id:'u',name:'A',goal:'recomp',experience:'intermediate',sex:'male',age:40,heightCm:180,weightKg:80,activityMultiplier:1.45,trainingDaysPerWeek:4,sessionMinutes:50,equipment:['gym'],restrictions:[] };
const session = (date:string, rir:number|null): WorkoutSession => ({ id:date,plannedWorkoutId:'p',localDate:date,startedAt:`${date}T08:00:00Z`,completedAt:`${date}T09:00:00Z`,exercises:[{exerciseId:'bench',sets:[{kg:80,reps:10,rir,completedAt:`${date}T08:10:00Z`}]}] });
const food = (date:string,kcal:number): FoodLogEntry => ({ id:date,localDate:date,name:'día',kcal,proteinG:150,carbsG:200,fatG:70,createdAt:`${date}T20:00:00Z` });

describe('summarizeProgress',()=>{
  it('uses only the last seven local dates and keeps RIR 0 valid',()=>{
    const result=summarizeProgress(profile,[session('2026-08-26',0),session('2026-08-19',3)],[],{kcal:2400,proteinG:160,carbsG:300,fatG:70},'2026-08-26');
    expect(result.completedWorkouts7d).toBe(1);
    expect(result.averageRir7d).toBe(0);
    expect(result.volumeLoad7d).toBe(800);
  });
  it('requires four nutrition logging days before judging adherence',()=>{
    const three=['2026-08-24','2026-08-25','2026-08-26'].map(d=>food(d,2400));
    expect(summarizeProgress(profile,[],three,{kcal:2400,proteinG:160,carbsG:300,fatG:70},'2026-08-26').nutritionAdherence).toBeNull();
    const four=[...three,food('2026-08-23',2400)];
    expect(summarizeProgress(profile,[],four,{kcal:2400,proteinG:160,carbsG:300,fatG:70},'2026-08-26').nutritionAdherence).toBe(1);
  });
});
