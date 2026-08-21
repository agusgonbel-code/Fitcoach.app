import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);const e=require('../weekly-adaptation-v36.js');

test('stable week recommends maintaining',()=>{const r=e.recommend({plan:{days:4},workouts:[{exercises:[]},{exercises:[]},{exercises:[]},{exercises:[]}],profile:{goal:'recomp'}});assert.equal(r.adjustments.deload,false);assert.equal(r.adjustments.kcalDelta,0);});

test('high effort plus falling performance triggers deload',()=>{const workout=(kg)=>({exercises:[{sets:[{kg,reps:8,rir:0},{kg,reps:8,rir:0}]}]});const r=e.recommend({plan:{days:4},workouts:[workout(100),workout(100),workout(85),workout(82)],profile:{goal:'recomp'}});assert.equal(r.adjustments.deload,true);assert.ok(r.adjustments.volumePercent<0);});

test('high RIR with stable performance permits conservative load increase',()=>{const workout=(kg)=>({exercises:[{sets:[{kg,reps:10,rir:4},{kg,reps:10,rir:3}]}]});const r=e.recommend({plan:{days:4},workouts:[workout(50),workout(50),workout(51),workout(51)],profile:{goal:'gain'}});assert.equal(r.adjustments.loadPercent,2.5);});
