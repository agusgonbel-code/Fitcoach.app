import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../client-engine-v35.js');

test('mealShares always sums to 1', () => {
  for (const meals of [3,4,5,6]) {
    for (const pattern of ['balanced','breakfast','lunch','dinner']) {
      const shares = engine.mealShares(meals, pattern);
      assert.equal(shares.length, meals);
      assert.ok(Math.abs(shares.reduce((a,b)=>a+b,0)-1) < 1e-9);
    }
  }
});

test('mealTargets reconcile exactly with daily targets', () => {
  const daily = { kcal: 2375, protein: 171, carbs: 251, fat: 69 };
  const meals = engine.mealTargets(daily, 5, 'lunch');
  assert.deepEqual(meals.reduce((a,m)=>({kcal:a.kcal+m.kcal,protein:a.protein+m.protein,carbs:a.carbs+m.carbs,fat:a.fat+m.fat}),{kcal:0,protein:0,carbs:0,fat:0}), daily);
});

test('calculateNutrition returns reconciled macro calories', () => {
  const result = engine.calculateNutrition({ sex:'m', age:40, height:180, weight:80, activity:1.45, goal:'recomp' });
  const macroKcal = result.targets.protein*4 + result.targets.carbs*4 + result.targets.fat*9;
  assert.ok(Math.abs(macroKcal-result.targets.kcal) <= 4);
  assert.ok(result.maintenance > result.targets.kcal);
});

test('training respects requested days and excludes unavailable equipment', () => {
  const exercises = [
    {name:'Press', muscle:'Pecho', equipment:'Mancuernas', pattern:'Empuje horizontal', alt:'Flexión'},
    {name:'Remo', muscle:'Espalda', equipment:'Mancuernas', pattern:'Tracción horizontal', alt:'Remo banda'},
    {name:'Goblet', muscle:'Cuádriceps', equipment:'Mancuernas', pattern:'Dominante de rodilla', alt:'Sentadilla'},
    {name:'RDL', muscle:'Isquios', equipment:'Barra', pattern:'Bisagra de cadera', alt:'Curl'},
    {name:'Core', muscle:'Core', equipment:'Peso corporal', pattern:'Anti-extensión', alt:'Dead bug'},
    {name:'Elevación', muscle:'Hombros', equipment:'Mancuernas', pattern:'Abducción', alt:'Polea'},
    {name:'Curl', muscle:'Bíceps', equipment:'Mancuernas', pattern:'Flexión de codo', alt:'Polea'},
    {name:'Tríceps', muscle:'Tríceps', equipment:'Mancuernas', pattern:'Extensión de codo', alt:'Polea'},
    {name:'Puente', muscle:'Glúteos', equipment:'Peso corporal', pattern:'Extensión de cadera', alt:'Hip thrust'},
    {name:'Gemelo', muscle:'Gemelos', equipment:'Peso corporal', pattern:'Flexión plantar', alt:'Prensa'}
  ];
  const plan = engine.buildTrainingPlan({days:4,minutes:50,equipment:['Mancuernas','Peso corporal'],experience:'intermediate'}, exercises);
  assert.equal(Object.keys(plan.routine).length, 4);
  assert.ok(Object.values(plan.routine).flat().every(x => x.name !== 'RDL'));
});

test('fixed morning meals keep real ingredient macros and reconcile the rest within visible tolerance', () => {
  globalThis.window = globalThis;
  require('../nutrition-data.js');
  const profile = engine.normalizeProfile({sex:'m',age:46,height:181,weight:75,activity:1.45,goal:'gain',days:4,meals:4,trainingTime:'06:00',includeBreakfastCake:true,includePostWorkoutShake:true});
  const nutrition = engine.calculateNutrition(profile);
  const menu = engine.generateMenu(profile,nutrition.targets,globalThis.FITCOACH_NUTRITION.recipes,globalThis.FITCOACH_NUTRITION.ingredients,7);
  assert.ok(menu.days.every(day=>day.withinTolerance));
  assert.ok(menu.days.slice(0,4).every(day=>day.meals.some(meal=>meal.recipeId==='fixed-post-workout-shake')));
  assert.ok(menu.days.slice(4).every(day=>!day.meals.some(meal=>meal.recipeId==='fixed-post-workout-shake')));
  assert.ok(menu.days.every(day=>day.meals.some(meal=>meal.recipeId==='fixed-breakfast-cake')));
  assert.ok(menu.days.flatMap(day=>day.meals).every(meal=>meal.macroAdjusted!==true));
  for (const day of menu.days) {
    const sum=day.meals.reduce((a,m)=>({kcal:a.kcal+m.macros.kcal,protein:a.protein+m.macros.p,carbs:a.carbs+m.macros.c,fat:a.fat+m.macros.f}),{kcal:0,protein:0,carbs:0,fat:0});
    assert.ok(Math.abs(sum.kcal-day.totals.kcal)<1e-6);
    assert.ok(Math.abs(sum.protein-day.totals.protein)<1e-6);
  }
});

test('profile preserves bounded waist, clinical context and recovery preferences',()=>{
  const profile=engine.normalizeProfile({waist:999,conditions:'Hipertensión controlada',contraindications:'Evitar bisagras',mealSchedule:'07:30, 14:00, 21:00',supplements:'Creatina',sleep:20,hunger:9,recovery:0});
  assert.equal(profile.waist,200);assert.equal(profile.conditions,'Hipertensión controlada');assert.equal(profile.contraindications,'Evitar bisagras');assert.equal(profile.sleep,12);assert.equal(profile.hunger,5);assert.equal(profile.recovery,1);
});

