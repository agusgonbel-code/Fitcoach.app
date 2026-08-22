import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);const e=require('../weekly-adaptation-v36.js');

test('stable week recommends maintaining',()=>{const r=e.recommend({plan:{days:4},workouts:[{exercises:[]},{exercises:[]},{exercises:[]},{exercises:[]}],profile:{goal:'recomp'}});assert.equal(r.adjustments.deload,false);assert.equal(r.adjustments.kcalDelta,0);});

test('high effort plus falling performance triggers deload',()=>{const workout=(kg)=>({exercises:[{sets:[{kg,reps:8,rir:0},{kg,reps:8,rir:0}]}]});const r=e.recommend({plan:{days:4},workouts:[workout(100),workout(100),workout(85),workout(82)],profile:{goal:'recomp'}});assert.equal(r.adjustments.deload,true);assert.ok(r.adjustments.volumePercent<0);});

test('high RIR with stable performance permits conservative load increase',()=>{const workout=(kg)=>({exercises:[{sets:[{kg,reps:10,rir:4},{kg,reps:10,rir:3}]}]});const r=e.recommend({plan:{days:4},workouts:[workout(50),workout(50),workout(51),workout(51)],profile:{goal:'gain'}});assert.equal(r.adjustments.loadPercent,2.5);});

test('nutrition adherence sums meals by day instead of comparing one meal with daily calories',()=>{const meals=[];for(let d=1;d<=4;d++)for(let m=0;m<4;m++)meals.push({date:`2026-08-0${d}`,kcal:600});const s=e.summarize({targets:{kcal:2400},meals,plan:{days:4}});assert.equal(s.avgDailyKcal,2400);assert.equal(s.nutritionAdherence,1);assert.equal(s.nutritionLoggingDays,4);assert.equal(s.nutritionReliable,true);});

test('calorie coaching holds when nutrition or weight evidence is insufficient',()=>{const r=e.recommend({targets:{kcal:2400},meals:[{date:'2026-08-01',kcal:2400}],metrics:[{date:'2026-08-01',weight:80},{date:'2026-08-02',weight:80}],profile:{goal:'loss'},plan:{days:4}});assert.equal(r.adjustments.kcalDelta,0);assert.equal(r.dataQuality.nutrition,'insufficient');assert.equal(r.dataQuality.weight,'insufficient');});

test('weight trend is normalized per week and enables conservative loss adjustment with enough data',()=>{const meals=[];for(let d=1;d<=7;d++)for(let m=0;m<4;m++)meals.push({date:`2026-08-0${d}`,kcal:600});const metrics=[{date:'2026-08-01',weight:80},{date:'2026-08-04',weight:80},{date:'2026-08-08',weight:80},{date:'2026-08-12',weight:80},{date:'2026-08-15',weight:80}];const r=e.recommend({targets:{kcal:2400},meals,metrics,profile:{goal:'loss'},plan:{days:4},workouts:[{exercises:[]},{exercises:[]},{exercises:[]}]});assert.equal(r.dataQuality.nutrition,'usable');assert.equal(r.dataQuality.weight,'usable');assert.equal(r.adjustments.kcalDelta,-100);});
