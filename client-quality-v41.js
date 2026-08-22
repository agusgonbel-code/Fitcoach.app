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
  function allergyTerms(profile={}){
    return String(profile.allergies||'').split(/[,;\n]+/).map(norm).filter(Boolean);
  }
  function recipeText(recipe={},ingredientMap={}){
    const names=(recipe.ings||[]).map(([id])=>ingredientMap[id]?.name||'');
    return norm([recipe.name||'',...names].join(' '));
  }
  function filterAllergyUnsafeRecipes(profile,recipes=[],ingredients=[]){
    const terms=allergyTerms(profile);
    if(!terms.length)return recipes.slice();
    const map=Object.fromEntries((ingredients||[]).map(item=>[item.id,item]));
    return (recipes||[]).filter(recipe=>{
      const text=recipeText(recipe,map);
      return !terms.some(term=>text.includes(term));
    });
  }
  function install(engine){
    if(!engine||engine.__qualityV41)return engine;
    const originalPlan=engine.buildTrainingPlan?.bind(engine);
    const originalMenu=engine.generateMenu?.bind(engine);
    if(typeof originalPlan==='function')engine.buildTrainingPlan=(input,exercises)=>{
      const plan=originalPlan(input,exercises);
      const start=new Date(),end=new Date(start);
      end.setDate(end.getDate()+(Number(plan.weeks)||8)*7-1);
      return {...plan,start:localDateKey(start),end:localDateKey(end)};
    };
    if(typeof originalMenu==='function')engine.generateMenu=(input,targets,recipes=[],ingredients=[],days=30)=>{
      const profile=engine.normalizeProfile?engine.normalizeProfile(input):input||{};
      const safeRecipes=filterAllergyUnsafeRecipes(profile,recipes,ingredients);
      const result=originalMenu(input,targets,safeRecipes,ingredients,days);
      if(allergyTerms(profile).length){
        const expected=Math.max(1,Number(profile.meals)||4);
        const incomplete=(result.days||[]).some(day=>(day.meals||[]).length!==expected);
        if(incomplete)throw new Error('No hay suficientes recetas compatibles con las alergias indicadas. Revisa las restricciones o amplía la biblioteca antes de generar el menú.');
      }
      return {...result,quality:{...(result.quality||{}),allergyScreening:'ingredient-aware-v41',localPlanDates:true}};
    };
    engine.__qualityV41=true;
    return engine;
  }
  return{install,localDateKey,allergyTerms,filterAllergyUnsafeRecipes};
});
