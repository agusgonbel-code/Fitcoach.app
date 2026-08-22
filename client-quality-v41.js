(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root){root.FitCoachClientQualityV41=api;if(root.FitCoachClientEngine)api.install(root.FitCoachClientEngine);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function localDateKey(value=new Date()){
    const date=value instanceof Date?value:new Date(value);
    if(Number.isNaN(date.getTime()))throw new TypeError('Fecha local no válida');
    return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }
  function allergyTerms(profile={}){return String(profile.allergies||'').split(/[,;\n]+/).map(norm).filter(Boolean);}
  function recipeText(recipe={},ingredientMap={}){const names=(recipe.ings||[]).map(([id])=>ingredientMap[id]?.name||'');return norm([recipe.name||'',...names].join(' '));}
  function filterAllergyUnsafeRecipes(profile,recipes=[],ingredients=[]){
    const terms=allergyTerms(profile);if(!terms.length)return recipes.slice();
    const map=Object.fromEntries((ingredients||[]).map(item=>[item.id,item]));
    return (recipes||[]).filter(recipe=>{const text=recipeText(recipe,map);return !terms.some(term=>text.includes(term));});
  }
  function validMacros(macros){
    if(macros==null)return true;
    if(typeof macros!=='object')return false;
    return ['kcal','p','c','f'].every(key=>Number.isFinite(Number(macros[key]))&&Number(macros[key])>=0);
  }
  function validateMenuStructure(result,profile={},requestedDays=30){
    const expectedMeals=Math.min(6,Math.max(3,Math.round(Number(profile.meals)||4)));
    const expectedDays=Math.min(30,Math.max(1,Math.round(Number(requestedDays)||30)));
    const days=Array.isArray(result?.days)?result.days:[];
    if(days.length!==expectedDays)throw new Error(`El menú está incompleto: se solicitaron ${expectedDays} días y se generaron ${days.length}.`);
    const bad=days.find(day=>!Array.isArray(day.meals)||day.meals.length!==expectedMeals||day.meals.some(meal=>!meal||!meal.recipeId));
    if(bad)throw new Error(`No hay suficientes recetas para completar ${expectedMeals} comidas al día. Amplía la biblioteca o revisa las preferencias antes de generar el menú.`);
    const corrupt=days.find(day=>day.meals.some(meal=>!validMacros(meal.macros)));
    if(corrupt)throw new Error('El menú contiene datos nutricionales no válidos. Vuelve a generarlo antes de guardarlo o usarlo.');
    return result;
  }
  function install(engine){
    if(!engine||engine.__qualityV41)return engine;
    const originalPlan=engine.buildTrainingPlan?.bind(engine),originalMenu=engine.generateMenu?.bind(engine);
    if(typeof originalPlan==='function')engine.buildTrainingPlan=(input,exercises)=>{const plan=originalPlan(input,exercises),start=new Date(),end=new Date(start);end.setDate(end.getDate()+(Number(plan.weeks)||8)*7-1);return{...plan,start:localDateKey(start),end:localDateKey(end)};};
    if(typeof originalMenu==='function')engine.generateMenu=(input,targets,recipes=[],ingredients=[],days=30)=>{
      const profile=engine.normalizeProfile?engine.normalizeProfile(input):input||{},safeRecipes=filterAllergyUnsafeRecipes(profile,recipes,ingredients);
      let result=originalMenu(input,targets,safeRecipes,ingredients,days);
      try{result=validateMenuStructure(result,profile,days);}catch(error){if(allergyTerms(profile).length&&/recetas/.test(String(error?.message||'')))throw new Error('No hay suficientes recetas compatibles con las alergias indicadas para completar todas las comidas. Revisa las restricciones o amplía la biblioteca.');throw error;}
      return{...result,quality:{...(result.quality||{}),allergyScreening:'ingredient-aware-v41',menuCompleteness:'strict-v42',macroPayloadValidation:'strict-v43',localPlanDates:true}};
    };
    engine.__qualityV41=true;return engine;
  }
  return{install,localDateKey,allergyTerms,filterAllergyUnsafeRecipes,validMacros,validateMenuStructure};
});
