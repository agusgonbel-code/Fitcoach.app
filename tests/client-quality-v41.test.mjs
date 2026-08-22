import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const quality=require('../client-quality-v41.js');
const engine=require('../client-engine-v35.js');
quality.install(engine);

test('local plan dates use the civil day instead of UTC serialization',()=>{const d=new Date(2026,0,2,0,30,0);assert.equal(quality.localDateKey(d),'2026-01-02');});
test('allergy screening checks ingredient names, not only recipe title',()=>{const ingredients=[{id:'a',name:'Avena'},{id:'p',name:'Crema de cacahuete'},{id:'y',name:'Yogur'}];const recipes=[{id:'unsafe',name:'Bol energético',meal:'Desayuno/Merienda',ings:[['a',70],['p',20]]},{id:'safe',name:'Bol de yogur',meal:'Desayuno/Merienda',ings:[['a',60],['y',200]]}];assert.deepEqual(quality.filterAllergyUnsafeRecipes({allergies:'cacahuete'},recipes,ingredients).map(x=>x.id),['safe']);});
test('allergy matching is accent insensitive',()=>{assert.equal(quality.filterAllergyUnsafeRecipes({allergies:'cacahuete'},[{id:'x',name:'Receta',ings:[['p',20]]}],[{id:'p',name:'CACAHUÉTE tostado'}]).length,0);});
test('menu validator rejects missing meals even without allergies',()=>{assert.throws(()=>quality.validateMenuStructure({days:[{meals:[{recipeId:'a'},{recipeId:'b'}]}]},{meals:4},1),/suficientes recetas/);});
test('menu validator rejects missing requested days',()=>{assert.throws(()=>quality.validateMenuStructure({days:[{meals:Array.from({length:4},(_,i)=>({recipeId:String(i)}))}]},{meals:4},2),/se solicitaron 2 días/);});
test('installed plan keeps duration and emits local-date keys',()=>{const muscles=['Pecho','Espalda','Cuádriceps','Isquios','Glúteos','Hombros','Bíceps','Tríceps','Core','Gemelos'];const library=muscles.map((muscle,i)=>({name:'Ejercicio '+i,muscle,equipment:'Máquina',alt:'Alternativa',pattern:'p'+i}));const plan=engine.buildTrainingPlan({days:4,weeks:8,equipment:['Máquina']},library);assert.match(plan.start,/^\d{4}-\d{2}-\d{2}$/);assert.match(plan.end,/^\d{4}-\d{2}-\d{2}$/);const [sy,sm,sd]=plan.start.split('-').map(Number),[ey,em,ed]=plan.end.split('-').map(Number);assert.equal(Math.round((new Date(ey,em-1,ed,12)-new Date(sy,sm-1,sd,12))/86400000),55);});
