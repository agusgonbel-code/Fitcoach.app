(()=>{'use strict';
const $=id=>document.getElementById(id);
const first=(...ids)=>ids.map($).find(Boolean)||null;
const labels={trainingDay:'Día de entrenamiento',sx:'Sexo',age:'Edad',hei:'Altura en centímetros',wei:'Peso en kilogramos',bf:'Grasa corporal en porcentaje',act:'Nivel de actividad',ng:'Objetivo',eq:'Ecuación',meals:'Comidas por día'};
function labelControls(root=document){
  root.querySelectorAll('input,select,textarea').forEach(control=>{
    if(control.getAttribute('aria-label')||control.getAttribute('aria-labelledby'))return;
    const explicit=control.id&&document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
    const parent=control.closest('label');
    const previous=control.previousElementSibling?.tagName==='LABEL'?control.previousElementSibling:null;
    const label=(explicit||parent||previous)?.textContent?.trim()||labels[control.id];
    if(label)control.setAttribute('aria-label',label);
    else if(control.placeholder)control.setAttribute('aria-label',control.placeholder);
  });
}
function calculatorError(message){
  const out=first('macro','macroResult');if(!out)return;
  out.innerHTML=`<div class="card notice" role="alert"><strong>No se puede calcular todavía.</strong><div>${message}</div></div>`;
}
function values(){
  return {
    sex:first('sx','calcSex')?.value,
    age:+first('age','calcAge')?.value,
    h:+first('hei','calcHeight')?.value,
    w:+first('wei','calcWeight')?.value,
    fat:+first('bf','calcFat')?.value,
    act:+first('act','calcActivity')?.value,
    goal:first('ng','calcGoal')?.value,
    eqn:first('eq','calcEquation')?.value
  };
}
function validateCalculator(){
  const {sex,age,h,w,fat,act,goal,eqn}=values();
  if(!['m','f'].includes(sex)||!Number.isFinite(age)||age<14||age>100||!Number.isFinite(h)||h<120||h>230||!Number.isFinite(w)||w<35||w>350||!Number.isFinite(act)||act<1.1||act>2.2){calculatorError('Revisa edad, altura, peso y nivel de actividad.');return false}
  if(eqn==='katch'&&(!Number.isFinite(fat)||fat<=2||fat>=70)){calculatorError('Para Katch-McArdle introduce un porcentaje de grasa corporal válido.');return false}
  const bmr=eqn==='katch'?370+21.6*(w*(1-fat/100)):10*w+6.25*h-5*age+(sex==='m'?5:-161);
  const factor={loss:.82,maintain:1,gain:1.08,recomp:.95}[goal];
  const kcal=Math.round(bmr*act*(factor||1));
  if(!Number.isFinite(kcal)||kcal<1200||kcal>5000){calculatorError('El objetivo estimado queda fuera del rango compatible de 1200–5000 kcal. Revisa tus datos o el objetivo antes de generar una dieta.');return false}
  const protein=Math.round(w*(goal==='loss'?2.2:2)),fatg=Math.round(w*.9);
  if(protein*4+fatg*9>=kcal){calculatorError('Ese objetivo no permite un reparto coherente de proteína, grasas y carbohidratos.');return false}
  return true;
}
document.addEventListener('click',event=>{
  if(event.target.closest('#calculateMacros,#doCalc')&&!validateCalculator()){
    event.preventDefault();event.stopImmediatePropagation();
  }
},true);
labelControls();
new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){labelControls(n);if(n.matches?.('input,select,textarea'))labelControls(n.parentElement||document)}}))).observe(document.body,{childList:true,subtree:true});
globalThis.FitCoachQualityV48={validateCalculator,labelControls};
})();
