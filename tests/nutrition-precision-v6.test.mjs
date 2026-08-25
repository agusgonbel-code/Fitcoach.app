import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const P=require('../nutrition-precision-v6.js');

const recipes=[
  {id:'lean',macros:{kcal:500,p:55,c:55,f:8}},
  {id:'balanced',macros:{kcal:600,p:35,c:70,f:18}},
  {id:'fatty',macros:{kcal:500,p:20,c:35,f:30}},
  {id:'snack',macros:{kcal:300,p:25,c:35,f:7}},
  {id:'breakfast',macros:{kcal:450,p:30,c:60,f:10}}
];
const target={kcal:2400,protein:170,carbs:285,fat:65};

test('totals are calculated from recipe macros and real scale',()=>{
  const day={meals:[{recipeId:'lean',scale:1.2},{recipeId:'snack',scale:.8}]};
  const t=P.totalDay(day,recipes);
  assert.equal(Math.round(t.kcal),840);
  assert.equal(Math.round(t.protein),86);
});

test('optimizer improves a menu day instead of trusting raw portions',()=>{
  const day={day:1,meals:[
    {recipeId:'breakfast',scale:1},
    {recipeId:'snack',scale:1},
    {recipeId:'lean',scale:1},
    {recipeId:'balanced',scale:1},
    {recipeId:'fatty',scale:1}
  ]};
  const before=P.totalDay(day,recipes);
  const optimized=P.optimizeDay(day,recipes,target);
  const after=P.totalDay(optimized,recipes);
  const errBefore=Math.abs(before.kcal-target.kcal)+Math.abs(before.protein-target.protein)*4;
  const errAfter=Math.abs(after.kcal-target.kcal)+Math.abs(after.protein-target.protein)*4;
  assert.ok(errAfter<errBefore);
  assert.equal(optimized.meals.length,5);
});

test('validator rejects a day outside configured tolerances',()=>{
  const day={meals:[{recipeId:'fatty',scale:1},{recipeId:'fatty',scale:1}]};
  const result=P.validateDay(day,recipes,target);
  assert.equal(result.valid,false);
  assert.ok(Math.abs(result.errors.kcal)>target.kcal*.03);
});

test('30-day menu receives a validation report',()=>{
  const base={meals:[
    {recipeId:'breakfast',scale:1},
    {recipeId:'snack',scale:1},
    {recipeId:'lean',scale:1},
    {recipeId:'balanced',scale:1},
    {recipeId:'fatty',scale:1}
  ]};
  const menu={targets:target,count:5,days:Array.from({length:30},(_,i)=>({day:i+1,meals:base.meals.map(x=>({...x}))}))};
  const result=P.optimizeMenu(menu,recipes);
  assert.equal(result.menu.days.length,30);
  assert.equal(result.report.days.length,30);
  assert.equal(typeof result.menu.precision.valid,'boolean');
  assert.ok(result.report.days.every(x=>Number.isFinite(x.totals.kcal)));
});
