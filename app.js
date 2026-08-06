(() => {
  'use strict';

  const DATA = window.FITCOACH_DATA;
  const CROSS_WODS = window.FITCOACH_CROSS_WODS || [];
  const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const $ = id => document.getElementById(id);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const Store = {
    get(key, fallback) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const defaults = {
    profile: {name:'Agustín'},
    settings: {rest:90,theme:'dark',weeklySessionGoal:4,stepGoal:8000},
    targets: {kcal:3014,protein:156,carbs:422,fat:78},
    routines: createEvidenceRoutine(),
    workouts: [],
    meals: [],
    metrics: [],
    photos: [],
    recovery: [],
    nutritionPlan: null,
    crossHistory: [],
    preferences:{planGoal:'recomp',planMethod:'evidence',planDays:'4',planMinutes:'60',priorityMuscle:'balanced',progressionMode:'double',calcEquation:'mifflin',calcSex:'m',calcAge:'46',calcHeight:'181',calcWeight:'81',calcFat:'22',calcActivity:'1.6',calcGoal:'recomp',menuMeals:'5',menuDays:'7',portionMeals:'5',portionTolerance:'150',trainingExperience:'intermediate',trainingLocation:'gym',dietStyle:'omnivore',nutritionBudget:'any',nutritionMaxPrep:'0',calorieStrategy:'flat',excludedIngredients:''}
  };

  let state = {
    profile: Store.get('profile', defaults.profile),
    settings: Store.get('settings', defaults.settings),
    targets: Store.get('targets', defaults.targets),
    routines: Store.get('routines', defaults.routines),
    workouts: Store.get('workouts', defaults.workouts),
    meals: Store.get('meals', defaults.meals),
    metrics: Store.get('metrics', defaults.metrics),
    photos: Store.get('photos', defaults.photos),
    recovery: Store.get('recovery', defaults.recovery),
    nutritionPlan: Store.get('nutritionPlan', defaults.nutritionPlan),
    crossHistory: Store.get('crossHistory', defaults.crossHistory),
    preferences: Store.get('preferences', defaults.preferences)
  };

  let timerId = null;
  let timerLeft = 0;
  let pendingPhotos = [];
  let equivalentContext = null;


  const planEvidenceMap={
    evidence:{title:'Hipertrofia equilibrada',text:'Volumen moderado en cuatro sesiones, frecuencia aproximada de dos estímulos por músculo y trabajo normalmente a 1-3 RIR.',tags:['6-15 repeticiones','1-3 RIR','volumen moderado']},
    upperlower:{title:'Upper / Lower',text:'Divide torso y pierna en dos sesiones semanales cada uno. La frecuencia ayuda a distribuir el volumen y la fatiga.',tags:['4 días','frecuencia 2','recuperación predecible']},
    fullbody:{title:'Full Body',text:'Tres sesiones de cuerpo completo con menor volumen por sesión. Útil para adherencia y aprendizaje técnico.',tags:['3 días','cuerpo completo','adherencia alta']},
    strength:{title:'Fuerza',text:'Prioriza cargas altas y rangos bajos en movimientos principales, con accesorios moderados.',tags:['3-6 repeticiones','descansos amplios','especificidad']},
    powerbuilding:{title:'Powerbuilding',text:'Combina movimientos principales pesados con accesorios de hipertrofia.',tags:['fuerza + hipertrofia','4 días','doble progresión']},
    minimum:{title:'Dosis mínima efectiva',text:'Tres sesiones breves y pocos ejercicios prioritarios. Añade volumen solo cuando el progreso se estanque.',tags:['3 días','45 minutos','volumen bajo']},
    lowload:{title:'Bajo impacto / cargas moderadas',text:'Máquinas, poleas y 10-20 repeticiones para reducir cargas articulares externas manteniendo esfuerzo suficiente.',tags:['10-20 repeticiones','máquinas','2-3 RIR']},
    mentzer:{title:'Heavy Duty inspirado en Mentzer',text:'Muy bajo volumen y esfuerzo alto. No se presenta como superior y evita exigir fallo absoluto en ejercicios complejos.',tags:['bajo volumen','0-2 RIR','fatiga vigilada']},
    ppl:{title:'Push / Pull / Legs',text:'Organiza el trabajo por patrones de empuje, tracción y pierna. Se adapta a 3 o más días sin exigir seis sesiones.',tags:['3-6 días','volumen distribuido','flexible']},
    phul:{title:'PHUL adaptado',text:'Alterna sesiones orientadas a fuerza con sesiones de hipertrofia, manteniendo volumen recuperable.',tags:['4 días','fuerza + hipertrofia','periodización ondulante']},
    fivebyfive:{title:'5x5 adaptado',text:'Prioriza práctica de patrones básicos con cinco series moderadas. Los accesorios y la carga se ajustan para controlar la fatiga.',tags:['fuerza','5x5','técnica']},
    home:{title:'Entrenamiento en casa',text:'Rutina con peso corporal, bandas y mancuernas opcionales, usando progresiones de repeticiones y dificultad.',tags:['casa','poco material','progresión por variantes']},
    metabolic:{title:'Circuito de acondicionamiento',text:'Circuitos de cuerpo completo con cargas moderadas. Complementa la fuerza, no la sustituye como única estrategia universal.',tags:['circuitos','condición física','RIR 2-4']},
    specialization:{title:'Especialización muscular',text:'Añade volumen prudente al grupo prioritario y reduce trabajo accesorio en otros grupos para mantener la recuperación.',tags:['prioridad muscular','bloques 4-6 semanas','fatiga controlada']}
  };
  function createUpperLowerRoutine(){
    return {
      Lunes:[['Press banca con mancuernas',3,'6-10','Press en máquina'],['Remo con apoyo de pecho',3,'8-12','Remo en polea'],['Press militar sentado',3,'8-12','Press de hombros en máquina'],['Jalón al pecho',3,'8-12','Dominada asistida'],['Elevaciones laterales',3,'12-20','Elevación lateral en polea'],['Curl con barra EZ',2,'10-15','Curl con mancuernas'],['Extensión de tríceps en polea',2,'10-15','Fondos asistidos']],
      Martes:[['Sentadilla goblet',3,'8-12','Prensa de piernas'],['Peso muerto rumano',3,'6-10','Curl femoral'],['Prensa de piernas',3,'10-15','Hack squat'],['Curl femoral sentado',3,'10-15','Curl femoral tumbado'],['Gemelo de pie',4,'10-20','Gemelo en prensa'],['Dead bug',3,'8-12','Plancha']],
      Miércoles:[['Press inclinado con mancuernas',3,'8-12','Press inclinado en máquina'],['Remo unilateral con mancuerna',3,'8-12','Remo en polea'],['Aperturas en polea',2,'12-15','Pec deck'],['Pullover en polea',3,'10-15','Jalón al pecho'],['Pájaros en máquina',3,'12-20','Face pull'],['Curl martillo',2,'10-15','Curl con cuerda'],['Tríceps por encima de la cabeza',2,'10-15','Press francés']],
      Jueves:[['Hip thrust',3,'6-10','Puente de glúteo'],['Zancada atrás',3,'8-12','Step-up'],['Extensión de cuádriceps',3,'12-15','Prensa de piernas'],['Curl femoral sentado',3,'10-15','Curl femoral tumbado'],['Abducción de cadera en máquina',3,'12-20','Caminata lateral con banda'],['Gemelo sentado',4,'12-20','Gemelo de pie'],['Crunch en polea',3,'10-15','Reverse crunch']]
    };
  }
  function createFullBodyRoutine(){
    return {
      Lunes:[['Prensa de piernas',3,'6-10','Sentadilla goblet'],['Press banca con mancuernas',3,'6-10','Press en máquina'],['Remo con apoyo de pecho',3,'8-12','Remo en polea'],['Peso muerto rumano',2,'8-12','Curl femoral'],['Elevaciones laterales',2,'12-20','Elevación lateral en polea'],['Curl con barra EZ',2,'10-15','Curl con mancuernas'],['Crunch en polea',2,'10-15','Dead bug']],
      Miércoles:[['Hip thrust',3,'6-10','Puente de glúteo'],['Press militar sentado',3,'8-12','Press de hombros en máquina'],['Jalón al pecho',3,'8-12','Dominada asistida'],['Zancada atrás',2,'8-12','Step-up'],['Aperturas en polea',2,'12-15','Pec deck'],['Extensión de tríceps en polea',2,'10-15','Fondos asistidos'],['Gemelo de pie',3,'12-20','Gemelo en prensa']],
      Viernes:[['Sentadilla goblet',3,'8-12','Prensa de piernas'],['Press inclinado con mancuernas',3,'8-12','Press inclinado en máquina'],['Remo unilateral con mancuerna',3,'8-12','Remo en polea'],['Curl femoral sentado',2,'10-15','Curl femoral tumbado'],['Pájaros en máquina',2,'12-20','Face pull'],['Curl martillo',2,'10-15','Curl con cuerda'],['Plancha',3,'30-60 s','Dead bug']]
    };
  }
  function createMinimumRoutine(){
    return {
      Lunes:[['Prensa de piernas',3,'6-10','Sentadilla goblet'],['Press banca con mancuernas',3,'6-10','Press en máquina'],['Remo con apoyo de pecho',3,'8-12','Remo en polea'],['Peso muerto rumano',2,'8-12','Curl femoral'],['Elevaciones laterales',2,'12-20','Elevación lateral en polea']],
      Miércoles:[['Hip thrust',3,'6-10','Puente de glúteo'],['Press militar sentado',3,'8-12','Press de hombros en máquina'],['Jalón al pecho',3,'8-12','Dominada asistida'],['Zancada atrás',2,'8-12','Step-up'],['Curl con barra EZ',2,'10-15','Curl con mancuernas']],
      Viernes:[['Sentadilla goblet',3,'8-12','Prensa de piernas'],['Press inclinado con mancuernas',3,'8-12','Press inclinado en máquina'],['Remo en polea',3,'8-12','Remo unilateral'],['Curl femoral sentado',2,'10-15','Curl femoral tumbado'],['Extensión de tríceps en polea',2,'10-15','Fondos asistidos']]
    };
  }
  function createLowLoadRoutine(){
    return {
      Lunes:[['Press en máquina',3,'10-15','Press banca con mancuernas'],['Remo en máquina',3,'10-15','Remo con apoyo de pecho'],['Press de hombros en máquina',3,'10-15','Press militar sentado'],['Jalón al pecho',3,'10-15','Dominada asistida'],['Elevación lateral en polea',3,'12-20','Elevaciones laterales'],['Curl en polea',2,'12-20','Curl martillo'],['Extensión de tríceps en polea',2,'12-20','Fondos asistidos']],
      Martes:[['Prensa de piernas',3,'10-15','Sentadilla goblet'],['Curl femoral sentado',3,'12-20','Curl femoral tumbado'],['Extensión de cuádriceps',3,'12-20','Step-up bajo'],['Hip thrust en máquina',3,'10-15','Hip thrust'],['Abducción de cadera en máquina',3,'15-25','Caminata lateral con banda'],['Gemelo en prensa',4,'12-20','Gemelo de pie'],['Dead bug',3,'8-12','Plancha']],
      Miércoles:[['Press inclinado en máquina',3,'10-15','Press inclinado con mancuernas'],['Remo en polea',3,'10-15','Remo unilateral'],['Pec deck',3,'12-20','Aperturas en polea'],['Pullover en polea',3,'12-20','Jalón al pecho'],['Face pull',3,'12-20','Pájaros en máquina'],['Curl con cuerda',2,'12-20','Curl martillo'],['Tríceps por encima de la cabeza',2,'12-20','Press francés']],
      Jueves:[['Prensa de piernas',3,'12-20','Hack squat'],['Curl femoral sentado',3,'12-20','Curl femoral tumbado'],['Extensión de cuádriceps',3,'12-20','Step-up bajo'],['Puente de glúteo',3,'12-20','Hip thrust'],['Aducción de cadera en máquina',3,'15-25','Copenhagen plank'],['Gemelo sentado',4,'12-20','Gemelo de pie'],['Crunch en polea',3,'12-20','Reverse crunch']]
    };
  }
  function createPowerbuildingRoutine(){
    return {
      Lunes:[['Press banca con mancuernas',4,'4-6','Press en máquina'],['Remo con apoyo de pecho',4,'5-8','Remo en máquina'],['Press inclinado con mancuernas',3,'8-12','Press inclinado en máquina'],['Jalón al pecho',3,'8-12','Dominada asistida'],['Elevaciones laterales',3,'12-20','Elevación lateral en polea'],['Extensión de tríceps en polea',3,'10-15','Fondos asistidos']],
      Martes:[['Prensa de piernas',4,'4-6','Hack squat'],['Peso muerto rumano',4,'5-8','Curl femoral'],['Hip thrust',3,'6-10','Puente de glúteo'],['Extensión de cuádriceps',3,'10-15','Step-up'],['Gemelo de pie',4,'10-20','Gemelo en prensa'],['Crunch en polea',3,'10-15','Reverse crunch']],
      Miércoles:[['Press militar sentado',4,'4-6','Press de hombros en máquina'],['Remo en polea',4,'5-8','Remo unilateral'],['Aperturas en polea',3,'10-15','Pec deck'],['Pullover en polea',3,'10-15','Jalón al pecho'],['Pájaros en máquina',3,'12-20','Face pull'],['Curl con barra EZ',3,'8-12','Curl con mancuernas']],
      Jueves:[['Hip thrust',4,'4-6','Puente de glúteo'],['Sentadilla goblet',4,'6-10','Prensa de piernas'],['Curl femoral sentado',3,'8-12','Curl femoral tumbado'],['Zancada atrás',3,'8-12','Step-up'],['Abducción de cadera en máquina',3,'12-20','Caminata lateral con banda'],['Gemelo sentado',4,'10-20','Gemelo de pie']]
    };
  }
  function createPPLRoutine(){return {
    Lunes:[['Press banca con mancuernas',3,'6-10','Press en máquina'],['Press militar sentado',3,'8-12','Press de hombros en máquina'],['Press inclinado en máquina',3,'8-12','Press inclinado con mancuernas'],['Elevación lateral en polea',3,'12-20','Elevaciones laterales'],['Extensión de tríceps en polea',3,'10-15','Fondos asistidos']],
    Miércoles:[['Jalón al pecho',3,'6-10','Dominada asistida'],['Remo con apoyo de pecho',3,'8-12','Remo en máquina'],['Pullover en polea',2,'10-15','Jalón al pecho'],['Face pull',3,'12-20','Pájaros en máquina'],['Curl con barra EZ',3,'8-12','Curl en polea']],
    Viernes:[['Prensa de piernas',4,'6-10','Sentadilla goblet'],['Peso muerto rumano',3,'6-10','Curl femoral'],['Hip thrust',3,'8-12','Puente de glúteo'],['Extensión de cuádriceps',3,'10-15','Step-up bajo'],['Curl femoral sentado',3,'10-15','Curl femoral tumbado'],['Gemelo sentado',4,'12-20','Gemelo de pie']]
  }}
  function createPHULRoutine(){const r=createUpperLowerRoutine();Object.values(r).forEach((day,i)=>day.forEach((e,j)=>{if(i<2&&j<3){e[1]=4;e[2]='4-7'}else if(i>=2){e[2]=j<2?'6-10':'10-15'}}));return r}
  function createFiveByFiveRoutine(){return {
    Lunes:[['Prensa de piernas',5,'5','Hack squat'],['Press banca con mancuernas',5,'5','Press en máquina'],['Remo con apoyo de pecho',5,'5','Remo en máquina'],['Dead bug',3,'8-12','Plancha']],
    Miércoles:[['Peso muerto rumano',4,'5','Curl femoral'],['Press militar sentado',5,'5','Press de hombros en máquina'],['Jalón al pecho',4,'6-8','Dominada asistida'],['Gemelo de pie',3,'10-15','Gemelo en prensa']],
    Viernes:[['Prensa de piernas',5,'5','Sentadilla goblet'],['Press inclinado con mancuernas',4,'6','Press inclinado en máquina'],['Remo en polea',5,'5','Remo unilateral con mancuerna'],['Curl con barra EZ',2,'8-12','Curl en polea']]
  }}
  function createHomeRoutine(){return {
    Lunes:[['Flexiones',4,'8-20','Press suelo con mancuernas'],['Remo con banda',4,'10-20','Remo unilateral con mancuerna'],['Sentadilla búlgara',3,'8-15','Zancada atrás'],['Elevaciones laterales',3,'12-25','Elevación lateral con banda'],['Plancha',3,'30-60 s','Dead bug']],
    Miércoles:[['Sentadilla goblet',4,'10-20','Sentadilla al aire'],['Peso muerto rumano con mancuernas',4,'8-15','Buenos días con banda'],['Press militar con mancuernas',3,'8-15','Pike push-up'],['Curl con banda',3,'12-20','Curl martillo'],['Extensión de tríceps con banda',3,'12-20','Flexión cerrada']],
    Viernes:[['Step-up',3,'10-15','Zancada atrás'],['Puente de glúteo',4,'12-25','Hip thrust'],['Flexiones inclinadas',4,'10-25','Flexiones'],['Remo unilateral con mancuerna',4,'8-15','Remo con banda'],['Dead bug',3,'10-16','Plancha']]
  }}
  function createMetabolicRoutine(){const r=createFullBodyRoutine();Object.values(r).forEach(day=>day.forEach(e=>{e[1]=3;e[2]='10-15'}));return r}
  function createSpecializationRoutine(){const r=createUpperLowerRoutine(),priority=state.preferences?.priorityMuscle||'balanced';const map={shoulders:'Hombros',back:'Espalda',legs:'Cuádriceps'};const muscle=map[priority];if(muscle)Object.values(r).forEach(day=>day.forEach(e=>{if(exerciseMuscle(e[0])===muscle)e[1]=Math.min(5,e[1]+1)}));return r}
  function renderPlanEvidence(){const i=planEvidenceMap[$('planMethod').value]||planEvidenceMap.evidence;$('planEvidence').innerHTML=`<strong>${i.title}</strong>${i.text}<div class="planEvidenceTags">${i.tags.map(t=>`<span>${t}</span>`).join('')}</div>`}
  function preferenceFields(){return ['planGoal','planMethod','planDays','planMinutes','priorityMuscle','progressionMode','calcEquation','calcSex','calcAge','calcHeight','calcWeight','calcFat','calcActivity','calcGoal','menuMeals','menuDays','portionMeals','portionTolerance','trainingExperience','trainingLocation','dietStyle','nutritionBudget','nutritionMaxPrep','calorieStrategy','excludedIngredients']}
  function savePreferences(){preferenceFields().forEach(id=>{const el=$(id);if(el)state.preferences[id]=el.value});Store.set('preferences',state.preferences);if($('preferenceStatus'))$('preferenceStatus').textContent='Preferencias guardadas automáticamente.'}
  function restorePreferences(){preferenceFields().forEach(id=>{const el=$(id),v=state.preferences?.[id];if(el&&v!==undefined)el.value=String(v)});renderPlanEvidence()}
  function showMenuRecipe(id,scale=1){const r=DATA.recipes.find(x=>x.id===id);if(!r)return;const factor=Math.max(.5,Math.min(2,Number(scale)||1)),portion={kcal:Math.round(r.kcal*factor),p:Math.round(r.p*factor),c:Math.round(r.c*factor),f:Math.round(r.f*factor),ingredients:r.ingredients.map(x=>scaleIngredient(x,factor))};$('menuRecipeTitle').textContent=r.name;$('menuRecipeContent').innerHTML=`<span class="pill">${r.meal}</span>${Math.abs(factor-1)>.02?`<span class="portionBadge">Porción x${factor.toFixed(2)}</span>`:''}<div class="recipeModalMacros"><div><strong>${portion.kcal}</strong><span class="small">kcal</span></div><div><strong>${portion.p} g</strong><span class="small">proteína</span></div><div><strong>${portion.c} g</strong><span class="small">carbos</span></div><div><strong>${portion.f} g</strong><span class="small">grasas</span></div></div><h3>Ingredientes ajustados</h3><div class="small">${portion.ingredients.join('<br>')}</div><h3 style="margin-top:12px">Preparación</h3><ol>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ol><button id="addModalRecipe" style="width:100%;margin-top:10px">Añadir al diario</button>`;$('menuRecipeModal').classList.add('open');$('addModalRecipe').addEventListener('click',()=>{state.meals.push({id:Date.now(),date:todayKey(),type:r.meal,name:r.name,kcal:portion.kcal,p:portion.p,c:portion.c,f:portion.f});saveState();renderHome();$('menuRecipeModal').classList.remove('open');alert('Receta añadida al diario.')},{once:true})}

  function createEvidenceRoutine() {
    return {
      Lunes: [
        ['Press banca con mancuernas',3,'6-10','Press en máquina'],
        ['Remo con apoyo de pecho',3,'8-12','Remo en polea'],
        ['Press militar sentado',3,'8-12','Press de hombros en máquina'],
        ['Jalón al pecho',3,'8-12','Dominada asistida'],
        ['Elevaciones laterales',3,'12-20','Elevación lateral en polea'],
        ['Curl con barra EZ',2,'10-15','Curl con mancuernas'],
        ['Extensión de tríceps en polea',2,'10-15','Fondos asistidos']
      ],
      Martes: [
        ['Peso muerto rumano',3,'6-10','Curl femoral'],
        ['Prensa de piernas',3,'8-12','Hack squat'],
        ['Curl femoral sentado',3,'10-15','Curl femoral tumbado'],
        ['Extensión de cuádriceps',2,'12-15','Step-up bajo'],
        ['Gemelo de pie',3,'10-20','Gemelo en prensa'],
        ['Dead bug',3,'8-12','Plancha']
      ],
      Miércoles: [
        ['Press inclinado con mancuernas',3,'8-12','Press inclinado en máquina'],
        ['Remo en polea',3,'8-12','Remo unilateral'],
        ['Aperturas en polea',2,'12-15','Pec deck'],
        ['Jalón al pecho',3,'8-12','Pullover'],
        ['Pájaros en máquina',3,'12-20','Face pull'],
        ['Curl martillo',2,'10-15','Curl con cuerda'],
        ['Tríceps por encima de la cabeza',2,'10-15','Press francés']
      ],
      Jueves: [
        ['Hip thrust',3,'6-10','Puente de glúteo'],
        ['Prensa de piernas',3,'8-12','Hack squat'],
        ['Curl femoral sentado',3,'10-15','Curl femoral tumbado'],
        ['Zancada atrás',2,'8-12','Step-up'],
        ['Gemelo de pie',3,'12-20','Gemelo sentado'],
        ['Crunch en polea',3,'10-15','Reverse crunch']
      ]
    };
  }

  function createMentzerRoutine() {
    return {
      Lunes: [
        ['Press inclinado con mancuernas',1,'6-10','Press inclinado en máquina'],
        ['Jalón al pecho',1,'6-10','Dominada asistida'],
        ['Remo con apoyo de pecho',1,'6-10','Remo en máquina'],
        ['Elevaciones laterales',1,'8-12','Elevación lateral en polea'],
        ['Curl con barra EZ',1,'6-10','Curl con mancuernas'],
        ['Extensión de tríceps en polea',1,'6-10','Fondos asistidos']
      ],
      Miércoles: [
        ['Prensa de piernas',1,'8-12','Hack squat'],
        ['Peso muerto rumano',1,'6-10','Curl femoral'],
        ['Curl femoral sentado',1,'6-10','Curl femoral tumbado'],
        ['Gemelo de pie',1,'8-12','Gemelo en prensa'],
        ['Crunch en polea',1,'8-12','Reverse crunch']
      ],
      Viernes: [
        ['Press banca con mancuernas',1,'6-10','Press en máquina'],
        ['Remo en polea',1,'6-10','Remo unilateral'],
        ['Press militar sentado',1,'6-10','Press de hombros en máquina'],
        ['Jalón al pecho',1,'6-10','Pullover'],
        ['Extensión de cuádriceps',1,'8-12','Step-up'],
        ['Hip thrust',1,'6-10','Puente de glúteo']
      ]
    };
  }

  function createStrengthRoutine() {
    return {
      Lunes: [
        ['Press banca con mancuernas',4,'4-6','Press en máquina'],
        ['Remo con apoyo de pecho',4,'5-8','Remo en máquina'],
        ['Press militar sentado',3,'5-8','Press de hombros en máquina'],
        ['Curl con barra EZ',2,'8-10','Curl con mancuernas']
      ],
      Martes: [
        ['Prensa de piernas',4,'4-6','Hack squat'],
        ['Peso muerto rumano',4,'5-8','Curl femoral'],
        ['Gemelo de pie',3,'8-12','Gemelo en prensa'],
        ['Dead bug',3,'8-12','Plancha']
      ],
      Miércoles: [
        ['Press inclinado con mancuernas',4,'5-8','Press inclinado en máquina'],
        ['Jalón al pecho',4,'5-8','Dominada asistida'],
        ['Remo en polea',3,'6-10','Remo unilateral'],
        ['Extensión de tríceps en polea',2,'8-10','Fondos asistidos']
      ],
      Jueves: [
        ['Hip thrust',4,'5-8','Puente de glúteo'],
        ['Prensa de piernas',4,'6-10','Hack squat'],
        ['Curl femoral sentado',3,'8-12','Curl femoral tumbado'],
        ['Crunch en polea',3,'8-12','Reverse crunch']
      ]
    };
  }

  function saveState() {
    Object.entries(state).forEach(([key,value]) => Store.set(key,value));
  }

  function todayKey() {
    return new Date().toISOString().slice(0,10);
  }

  function showPage(id) {
    $$('.page').forEach(page => page.classList.toggle('active', page.id === id));
    $$('nav button').forEach(btn => btn.classList.toggle('active', btn.dataset.page === id));
    if (id === 'home') renderHome();
    if (id === 'training') renderTraining();
    if (id === 'nutrition') renderNutrition();
    if (id === 'progress') renderProgress();
    if (id === 'settings') renderSettings();
    if (id === 'crosstraining') renderCrossTraining();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function applyTheme() {
    document.body.classList.toggle('light', state.settings.theme === 'light');
    $('theme').value = state.settings.theme;
    renderAchievements();
    $('weeklySessionGoal').value = state.settings.weeklySessionGoal || 4;
    $('stepGoal').value = state.settings.stepGoal || 8000;
  }

  function totalsToday() {
    return state.meals.filter(m => m.date === todayKey()).reduce(
      (a,m) => ({kcal:a.kcal+m.kcal,p:a.p+m.p,c:a.c+m.c,f:a.f+m.f}),
      {kcal:0,p:0,c:0,f:0}
    );
  }

  function macroLine(label,value,target) {
    const pct = Math.min(100, target ? value/target*100 : 0);
    return `<div class="macro"><div class="macroHead"><span>${label}</span><span>${Math.round(value)} / ${target}</span></div><div class="progress"><div style="width:${pct}%"></div></div></div>`;
  }

  function weekStart() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate()-((now.getDay()+6)%7));
    start.setHours(0,0,0,0);
    return start;
  }


  function renderWeekTracker(){const set=new Set(state.workouts.map(w=>w.date.slice(0,10))),labels=['L','M','X','J','V','S','D'],start=weekStart();$('weekTracker').innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const k=d.toISOString().slice(0,10);return `<div class="weekDay ${set.has(k)?'done':''} ${k===todayKey()?'today':''}"><strong>${labels[i]}</strong><div>${d.getDate()}</div>${set.has(k)?'<div>✓</div>':''}</div>`}).join('')}
  function nutritionScore(){const t=state.targets,x=totalsToday();return Math.round(Math.max(0,100-Math.abs(x.kcal-t.kcal)/Math.max(1,t.kcal)*45-Math.max(0,t.protein-x.p)/Math.max(1,t.protein)*55))}
  function strengthTrend(){const h={};state.workouts.forEach(w=>w.exercises.forEach(e=>{const b=Math.max(0,...e.sets.map(s=>s.kg*(1+s.reps/30)));(h[e.name]??=[]).push(b)}));const c=Object.values(h).filter(v=>v.length>=2).map(v=>(v.at(-1)/Math.max(.1,v[0])-1)*100);return c.length?c.reduce((a,b)=>a+b,0)/c.length:0}
  function weightTrend7d(){const s=Date.now()-7*86400000,l=state.metrics.filter(m=>m.weight&&new Date(m.date).getTime()>=s);return l.length>=2?l.at(-1).weight-l[0].weight:0}
  function updateProScores(){const g=Number(state.settings.weeklySessionGoal||4),n=state.workouts.filter(w=>new Date(w.date)>=weekStart()).length,st=strengthTrend(),wt=weightTrend7d();$('scoreAdherence').textContent=`${Math.min(100,Math.round(n/g*100))}%`;$('scoreStrength').textContent=`${st>=0?'+':''}${st.toFixed(1)}%`;$('scoreWeight').textContent=`${wt>=0?'+':''}${wt.toFixed(1)} kg`;$('scoreNutrition').textContent=nutritionScore()}
  function applyPriorityToPlan(){const p=$('priorityMuscle').value,m={shoulders:['Press militar sentado','Elevaciones laterales','Pájaros en máquina'],back:['Remo con apoyo de pecho','Remo en polea','Jalón al pecho'],legs:['Prensa de piernas','Peso muerto rumano','Curl femoral sentado','Hip thrust','Zancada atrás']};if(p==='balanced')return alert('El plan ya está equilibrado.');Object.values(state.routines).forEach(d=>d.forEach(e=>{if((m[p]||[]).includes(e[0]))e[1]=Math.min(5,Number(e[1])+1)}));saveState();renderTraining();alert('Prioridad aplicada.')}
  function analyzeProgression(){const out=[],names=[...new Set(state.workouts.flatMap(w=>w.exercises.map(e=>e.name)))];names.forEach(name=>{let ex=null;for(let i=state.workouts.length-1;i>=0;i--){ex=state.workouts[i].exercises.find(x=>x.name===name);if(ex)break}if(!ex)return;const s=ex.sets.filter(x=>x.kg>0&&x.reps>0);if(!s.length)return;const rir=s.reduce((a,x)=>a+x.rir,0)/s.length,reps=s.reduce((a,x)=>a+x.reps,0)/s.length,kg=Math.max(...s.map(x=>x.kg));let a='Mantener',r='Mantén la carga y mejora la técnica.';if(rir>=3&&reps>=8){a=$('progressionMode').value==='reps'?'Añadir 1-2 repeticiones':`Subir a ${(kg*1.025).toFixed(1)} kg`;r='Tienes margen de esfuerzo.'}else if(rir<=1){a='Mantener o reducir 2-5%';r='La última sesión fue muy exigente.'}else if(rir>=2){a='Añadir 1 repetición por serie';r='Progresión conservadora.'}out.push({name,a,r})});$('progressionOutput').innerHTML=out.length?out.map(x=>`<div class="history"><strong>${x.name}</strong><div>${x.a}</div><div class="small">${x.r}</div></div>`).join(''):'<div class="empty">Necesitas al menos un entrenamiento registrado.</div>'}
  function scaleIngredient(t,s){const m=t.match(/^(\d+(?:[.,]\d+)?)\s*(g|ml)?\s*(.*)$/i);if(!m)return `${s.toFixed(2)} × ${t}`;return `${Math.round(parseFloat(m[1].replace(',','.'))*s)} ${m[2]||''} ${m[3]||''}`.replace(/\s+/g,' ').trim()}
  function generatePortionMenu(){const kcal=+$('portionKcal').value,protein=+$('portionProtein').value,count=+$('portionMeals').value,meals=count===4?['Desayuno','Comida','Merienda','Cena']:['Desayuno','Merienda','Comida','Merienda','Cena'],w=count===4?[.24,.34,.14,.28]:[.20,.12,.30,.13,.25];const selected=meals.map((meal,i)=>{const pool=DATA.recipes.filter(r=>r.meal===meal).slice();pool.sort((a,b)=>(Math.abs(a.kcal-kcal*w[i])+Math.abs(a.p-protein*w[i])*7)-(Math.abs(b.kcal-kcal*w[i])+Math.abs(b.p-protein*w[i])*7));const r=pool[0],s=Math.max(.55,Math.min(1.7,(kcal*w[i]/r.kcal)*.65+(protein*w[i]/r.p)*.35));return {...r,scale:s,kcal:Math.round(r.kcal*s),p:Math.round(r.p*s),c:Math.round(r.c*s),f:Math.round(r.f*s),scaledIngredients:r.ingredients.map(x=>scaleIngredient(x,s))}});const sum=selected.reduce((a,r)=>({kcal:a.kcal+r.kcal,p:a.p+r.p,c:a.c+r.c,f:a.f+r.f}),{kcal:0,p:0,c:0,f:0});$('portionMenuOutput').innerHTML=`<div class="card">${selected.map((r,i)=>`<div class="menuMeal"><strong>${meals[i]}: ${r.name}</strong> <span class="portionBadge">x${r.scale.toFixed(2)}</span><div class="small">${r.kcal} kcal · P ${r.p} · C ${r.c} · G ${r.f}</div><div class="small">${r.scaledIngredients.join('<br>')}</div></div>`).join('')}<div class="kcal">Total ${sum.kcal} kcal · P ${sum.p} g · C ${sum.c} g · G ${sum.f} g</div><div class="noteBox">Ajusta según etiquetas reales.</div></div>`}
  function renderMonthlyReport(){const s=Date.now()-30*86400000,w=state.workouts.filter(x=>new Date(x.date).getTime()>=s),m=state.metrics.filter(x=>new Date(x.date).getTime()>=s),meals=state.meals.filter(x=>new Date(x.date).getTime()>=s),wd=m.length>=2&&m[0].weight&&m.at(-1).weight?m.at(-1).weight-m[0].weight:0,wa=m.length>=2&&m[0].waist&&m.at(-1).waist?m.at(-1).waist-m[0].waist:0,d={};meals.forEach(x=>{d[x.date]??={p:0};d[x.date].p+=x.p});const pd=Object.values(d).filter(x=>x.p>=state.targets.protein*.9).length;$('monthlyReport').innerHTML=`<div class="kpiGrid"><div><div class="stat">${w.length}</div><div class="label">sesiones</div></div><div><div class="stat">${wd>=0?'+':''}${wd.toFixed(1)} kg</div><div class="label">peso</div></div><div><div class="stat">${wa>=0?'+':''}${wa.toFixed(1)} cm</div><div class="label">cintura</div></div><div><div class="stat">${pd}</div><div class="label">días proteína</div></div></div>`}


  let calendarCursor=new Date();
  function saveRecovery(){state.recovery.push({id:Date.now(),date:new Date().toISOString(),sleep:+$('recoverySleep').value||0,energy:+$('recoveryEnergy').value||0,stress:+$('recoveryStress').value||0,soreness:+$('recoverySoreness').value||0});saveState();renderReadiness();alert('Recuperación guardada.')}
  function readinessScore(){if(!state.recovery.length)return 0;const x=state.recovery.at(-1);return Math.round(Math.max(0,Math.min(100,50+(x.sleep-6.5)*9+(x.energy-3)*10-(x.stress-3)*9-(x.soreness-2)*7)))}
  function renderReadiness(){const s=readinessScore();$('homeReadiness').textContent=s;$('homeRecoveryStreak').textContent=state.recovery.length;$('readinessBar').style.width=s+'%';$('readinessText').textContent=s>=75?'Buena preparación.':s>=50?'Preparación media.':s>0?'Preparación baja.':'Registra recuperación.'}
  function renderCalendar(){const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),f=new Date(y,m,1),l=new Date(y,m+1,0),off=(f.getDay()+6)%7;$('calendarTitle').textContent=f.toLocaleDateString('es-ES',{month:'long',year:'numeric'});let o=['L','M','X','J','V','S','D'].map(x=>`<div class="calHead">${x}</div>`).join('');for(let i=0;i<off;i++)o+='<div></div>';const wd=new Set(state.workouts.map(x=>x.date.slice(0,10))),md=new Set(state.metrics.map(x=>x.date.slice(0,10)));for(let d=1;d<=l.getDate();d++){const date=new Date(y,m,d),k=date.toISOString().slice(0,10),t=date.toDateString()===new Date().toDateString();o+=`<div class="calDay ${t?'today':''} ${wd.has(k)?'workout':''} ${md.has(k)?'metric':''}"><strong>${d}</strong></div>`}$('activityCalendar').innerHTML=o}
  function achievements(){const pd={};state.meals.forEach(m=>pd[m.date]=(pd[m.date]||0)+m.p);const ph=Object.values(pd).filter(p=>p>=state.targets.protein*.9).length;return[{n:'Primer entrenamiento',d:'Guarda tu primera sesión.',ok:state.workouts.length>=1},{n:'Constancia inicial',d:'Completa 4 entrenamientos.',ok:state.workouts.length>=4},{n:'Mes activo',d:'Completa 12 entrenamientos.',ok:state.workouts.length>=12},{n:'Nutrición constante',d:'Alcanza proteína 7 días.',ok:ph>=7},{n:'Seguimiento corporal',d:'Registra 4 métricas.',ok:state.metrics.length>=4},{n:'Comparación visual',d:'Guarda al menos 2 fotos.',ok:state.photos.length>=2}]}
  function renderAchievements(){$('achievementList').innerHTML=achievements().map(a=>`<div class="achievement ${a.ok?'':'locked'}"><strong>${a.ok?'🏆':'🔒'} ${a.n}</strong><div class="small">${a.d}</div></div>`).join('')}
  const privacyText=`FitCoach guarda localmente entrenamientos, comidas, métricas, ajustes y fotografías. En esta versión no se envían a servidores ni se usan para publicidad. Puedes exportar o borrar los datos desde Ajustes.`;
  const termsText=`FitCoach ofrece herramientas generales de registro y planificación. No sustituye atención médica ni asesoramiento profesional.`;
  function openLegal(t){$('legalTitle').textContent=t==='privacy'?'Política de privacidad':'Términos de uso';$('legalContent').textContent=t==='privacy'?privacyText:termsText;$('legalModal').classList.add('open')}
  async function shareApp(){if(navigator.share){try{await navigator.share({title:'FitCoach',text:'Entrenamiento, nutrición y progreso.',url:location.href})}catch{}}}
  function maybeOnboarding(){if(!Store.get('onboardingDone',false))$('onboardingModal').classList.add('open')}
  function finishOnboarding(){state.profile.name=$('onboardingName').value.trim()||'Agustín';$('planGoal').value=$('onboardingGoal').value;$('planDays').value=$('onboardingDays').value;$('planMinutes').value=$('onboardingMinutes').value;generatePlan();Store.set('onboardingDone',true);$('onboardingModal').classList.remove('open');saveState();renderHome()}

  function renderHome() {
    const today = totalsToday();
    const week = state.workouts.filter(w => new Date(w.date) >= weekStart());
    $('homeGreeting').textContent = `Hola, ${state.profile.name || 'Agustín'}`;
    $('homeSessions').textContent = state.workouts.length;
    $('homeWeek').textContent = `${week.length}/4`;
    $('homeKcal').textContent = Math.round(today.kcal);
    $('homeProtein').textContent = `${Math.round(today.p)} g`;
    $('homeMacros').innerHTML =
      macroLine('Calorías',today.kcal,state.targets.kcal)+
      macroLine('Proteína',today.p,state.targets.protein)+
      macroLine('Carbohidratos',today.c,state.targets.carbs)+
      macroLine('Grasas',today.f,state.targets.fat);

    const tips = [];
    if (!state.workouts.length) tips.push('Registra tu primer entrenamiento para activar recomendaciones.');
    if (today.p < state.targets.protein*0.7) tips.push('La proteína de hoy está por debajo del 70% del objetivo.');
    if (week.length < 2 && new Date().getDay() >= 4) tips.push('La frecuencia semanal está baja para un plan de 4 días.');
    if (!tips.length) tips.push('Los registros actuales están dentro de un rango razonable. Mantén el plan.');
    $('homeCoach').innerHTML = `<div class="good">${tips.join('<br><br>')}</div>`;
    updateProScores();renderWeekTracker();

    const last = state.workouts[state.workouts.length-1];
    $('homeLast').innerHTML = last
      ? `<strong>${last.day}</strong><div class="small">${new Date(last.date).toLocaleString('es-ES')} · ${Math.round(last.volume).toLocaleString('es-ES')} kg</div>`
      : `<div class="empty">Sin actividad todavía.</div>`;
  }

  function generatePlan() {
    const method = $('planMethod').value;
    const goal = $('planGoal').value;
    let routine;if(method==='mentzer')routine=createMentzerRoutine();else if(method==='upperlower')routine=createUpperLowerRoutine();else if(method==='fullbody')routine=createFullBodyRoutine();else if(method==='minimum')routine=createMinimumRoutine();else if(method==='lowload')routine=createLowLoadRoutine();else if(method==='powerbuilding')routine=createPowerbuildingRoutine();else if(method==='ppl')routine=createPPLRoutine();else if(method==='phul')routine=createPHULRoutine();else if(method==='fivebyfive')routine=createFiveByFiveRoutine();else if(method==='home')routine=createHomeRoutine();else if(method==='metabolic')routine=createMetabolicRoutine();else if(method==='specialization')routine=createSpecializationRoutine();else if(method==='strength'||goal==='strength')routine=createStrengthRoutine();else routine=createEvidenceRoutine();
    const days = Number($('planDays').value);
    const keys = Object.keys(routine).slice(0,days);
    state.routines = Object.fromEntries(keys.map(k => [k,routine[k]]));
    savePreferences();
    saveState();
    renderTraining();
    alert('Plan generado correctamente.');
  }

  function populateDays() {
    const days = Object.keys(state.routines);
    $('trainingDay').innerHTML = days.map(d => `<option value="${d}">${d}</option>`).join('');
    const weekday = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()];
    if (days.includes(weekday)) $('trainingDay').value = weekday;
  }

  function lastExercise(name) {
    for (let i=state.workouts.length-1;i>=0;i--) {
      const found = state.workouts[i].exercises.find(e => e.name === name);
      if (found) return {exercise:found,date:state.workouts[i].date,day:state.workouts[i].day};
    }
    return null;
  }

  function progressionSuggestion(last,repsRange) {
    if (!last?.exercise?.sets?.length) return 'Primera sesión: usa una carga cómoda y termina con 2-3 RIR.';
    const completed = last.exercise.sets.filter(s => s.reps > 0);
    if (!completed.length) return 'No hay series completas previas.';
    const maxRep = Number(String(repsRange).match(/\d+$/)?.[0]) || 12;
    const allTop = completed.every(s => s.reps >= maxRep && s.rir >= 1);
    const tooHard = completed.some(s => s.rir <= 0 || s.reps < Math.max(1,maxRep-4));
    if (allTop) return 'Sugerencia: aumenta la carga un 2-5% y vuelve al rango bajo.';
    if (tooHard) return 'Sugerencia: mantén o reduce ligeramente la carga hasta recuperar el RIR objetivo.';
    return 'Sugerencia: mantén la carga e intenta sumar 1 repetición total.';
  }

  function equivalentExercises(name) {
    const current = DATA.exercises.find(ex => ex.name === name);
    if (!current) return [];
    const samePattern = DATA.exercises.filter(ex => ex.name !== name && ex.muscle === current.muscle && ex.pattern === current.pattern);
    const sameMuscle = DATA.exercises.filter(ex => ex.name !== name && ex.muscle === current.muscle && ex.pattern !== current.pattern);
    const explicit = DATA.exercises.find(ex => ex.name === current.alt);
    const combined = [explicit,...samePattern,...sameMuscle].filter(Boolean);
    return [...new Map(combined.map(ex => [ex.name,ex])).values()].slice(0,12);
  }

  function renderEquivalentOptions(){
    if(!equivalentContext)return;
    const {day,exerciseIndex}=equivalentContext,current=state.routines[day]?.[exerciseIndex];if(!current)return;
    const query=($('equivalentSearch')?.value||'').toLowerCase(),equipment=$('equivalentEquipment')?.value||'';
    const options=equivalentExercises(current[0]).filter(ex=>(!query||`${ex.name} ${ex.muscle} ${ex.pattern}`.toLowerCase().includes(query))&&(!equipment||ex.equipment===equipment));
    $('equivalentList').innerHTML=options.length?options.map(ex=>{const last=lastExercise(ex.name);return `<button class="equivalentOption" data-name="${ex.name}"><strong>${ex.name}</strong><span class="small">${ex.muscle} · ${ex.pattern} · ${ex.equipment}</span><span class="small">${last?`Última vez: ${new Date(last.workout.date).toLocaleDateString('es-ES')}`:'Sin registros previos'}</span></button>`}).join(''):'<div class="empty">No hay equivalentes con estos filtros.</div>';
    $$('.equivalentOption').forEach(btn=>btn.addEventListener('click',()=>selectEquivalentExercise(btn.dataset.name)));
  }
  function openEquivalentSelector(exerciseIndex) {
    const day=$('trainingDay').value,current=state.routines[day]?.[exerciseIndex];if(!current)return;
    equivalentContext={day,exerciseIndex};const currentData=DATA.exercises.find(ex=>ex.name===current[0]);
    $('equivalentTitle').textContent=`Sustituir ${current[0]}`;
    $('equivalentCurrent').innerHTML=`<strong>Ejercicio actual:</strong> ${current[0]}<div class="small">Se conservarán series y repeticiones. El historial del nuevo ejercicio aparecerá en futuras sesiones.</div>`;
    $('equivalentSearch').value='';const equipments=[...new Set(equivalentExercises(current[0]).map(ex=>ex.equipment))].sort();$('equivalentEquipment').innerHTML='<option value="">Todo el material</option>'+equipments.map(x=>`<option>${x}</option>`).join('');
    renderEquivalentOptions();$('equivalentModal').classList.add('open');
  }

  function selectEquivalentExercise(name) {
    if (!equivalentContext) return;
    const {day,exerciseIndex} = equivalentContext;
    const current = state.routines[day]?.[exerciseIndex];
    const selected = DATA.exercises.find(ex => ex.name === name);
    if (!current || !selected) return;
    const previousName = current[0];
    state.routines[day][exerciseIndex] = [selected.name,current[1],current[2],previousName];
    saveState();
    $('equivalentModal').classList.remove('open');
    equivalentContext = null;
    renderWorkoutList();
  }

  function renderWorkoutList() {
    const day = $('trainingDay').value;
    const exercises = state.routines[day] || [];
    $('workoutList').innerHTML = exercises.map((e,ei) => {
      const [name,sets,reps,alt] = e;
      const last = lastExercise(name);
      let rows = '';
      for (let si=0;si<sets;si++) {
        const prev = last?.exercise?.sets?.[si] || {};
        rows += `<div class="setRow">
          <div class="setNo">${si+1}</div>
          <input class="setKg" data-e="${ei}" data-s="${si}" type="number" step="0.5" placeholder="kg" value="${prev.kg ?? ''}">
          <input class="setReps" data-e="${ei}" data-s="${si}" type="number" placeholder="reps" value="${prev.reps ?? ''}">
          <input class="setRir" data-e="${ei}" data-s="${si}" type="number" placeholder="RIR" value="${prev.rir ?? ''}">
        </div>`;
      }
      const lastText = last ? `<div class="previousSession"><strong>Último registro · ${new Date(last.date).toLocaleDateString('es-ES')}</strong><div class="small">${last.exercise.sets.map(s => `${s.kg} kg × ${s.reps} · RIR ${s.rir}`).join(' | ')}</div><div class="small">${progressionSuggestion(last,reps)}</div></div>` : `<div class="small">Sin registros anteriores.</div>`;
      const equivalentCount = equivalentExercises(name).length;
      return `<div class="card workoutCard">
        <div class="exerciseHead"><div><h3>${name}</h3><span class="pill">${sets} series</span><span class="pill">${reps}</span></div><button class="secondary restButton">Descanso</button></div>
        <div class="exerciseActions"><div class="small">Alternativa rápida: ${alt}</div><button class="secondary equivalentButton" data-e="${ei}">Ver equivalentes (${equivalentCount})</button></div>${lastText}${rows}
      </div>`;
    }).join('') || `<div class="empty">No hay ejercicios para este día.</div>`;
    $$('.restButton').forEach(btn => btn.addEventListener('click', startTimer));
    $$('.equivalentButton').forEach(btn => btn.addEventListener('click', () => openEquivalentSelector(Number(btn.dataset.e))));
  }

  function exerciseMuscle(name) {
    return DATA.exercises.find(ex => ex.name === name)?.muscle || 'Otros';
  }

  function weeklyVolumeTargets() {
    const method = state.preferences?.planMethod || 'evidence';
    if (method === 'mentzer') return {min:2,max:6};
    if (method === 'minimum') return {min:4,max:8};
    if (method === 'strength') return {min:4,max:10};
    if (method === 'fullbody') return {min:6,max:12};
    return {min:6,max:14};
  }

  function weeklyTrainingSummary() {
    const start = weekStart();
    const workouts = state.workouts.filter(w => new Date(w.date) >= start);
    const muscles = {};
    let rirTotal = 0;
    let rirCount = 0;
    workouts.forEach(workout => workout.exercises.forEach(exercise => {
      const muscle = exerciseMuscle(exercise.name);
      const validSets = exercise.sets.filter(set => set.reps > 0 || set.kg > 0);
      muscles[muscle] = (muscles[muscle] || 0) + validSets.length;
      validSets.forEach(set => {
        if (Number.isFinite(set.rir)) {
          rirTotal += set.rir;
          rirCount += 1;
        }
      });
    }));
    const latestRecovery = state.recovery.at(-1);
    const readiness = latestRecovery ? readinessScore() : null;
    return {workouts,muscles,averageRir:rirCount ? rirTotal/rirCount : null,readiness};
  }

  function renderWeeklyVolume() {
    const output = $('weeklyVolumeOutput');
    if (!output) return;
    const summary = weeklyTrainingSummary();
    if (!summary.workouts.length) {
      output.innerHTML = '<div class="empty">Guarda entrenamientos para calcular el volumen semanal.</div>';
      return;
    }
    const target = weeklyVolumeTargets();
    const rows = Object.entries(summary.muscles).sort((a,b)=>b[1]-a[1]).map(([muscle,sets]) => {
      let status = 'Dentro del rango orientativo';
      let cls = 'volume-ok';
      if (sets < target.min) { status = 'Estímulo bajo esta semana'; cls = 'volume-low'; }
      if (sets > target.max) { status = 'Volumen alto: vigila recuperación'; cls = 'volume-high'; }
      const pct = Math.min(100, sets/Math.max(1,target.max)*100);
      return `<div class="volumeRow"><div class="volumeHead"><strong>${muscle}</strong><span>${sets} series</span></div><div class="volumeTrack"><div class="${cls}" style="width:${pct}%"></div></div><div class="small">${status} · referencia ${target.min}-${target.max}</div></div>`;
    }).join('');
    const fatigueSignals = [];
    if (summary.averageRir !== null && summary.averageRir <= 1) fatigueSignals.push('RIR medio muy bajo');
    if (summary.readiness !== null && summary.readiness < 55) fatigueSignals.push('recuperación baja');
    if (summary.workouts.length >= 4 && Object.values(summary.muscles).some(v => v > target.max)) fatigueSignals.push('volumen alto acumulado');
    const recommendation = fatigueSignals.length >= 2
      ? `Considera reducir 20-35% las series durante 5-7 días. Motivos: ${fatigueSignals.join(', ')}.`
      : fatigueSignals.length
        ? `Mantén la progresión conservadora y revisa descanso. Señal detectada: ${fatigueSignals[0]}.`
        : 'La carga semanal parece tolerable. Mantén el plan mientras rendimiento, sueño y molestias evolucionen bien.';
    const rirText = summary.averageRir === null ? 'sin datos suficientes' : summary.averageRir.toFixed(1);
    const readinessText = summary.readiness === null ? 'sin registro' : Math.round(summary.readiness);
    output.innerHTML = `${rows}<div class="volumeAdvice"><strong>Lectura global</strong><div class="small">${summary.workouts.length} sesiones · RIR medio ${rirText} · readiness ${readinessText}</div><div>${recommendation}</div></div>`;
  }

  function renderTraining() {
    populateDays();
    renderWorkoutList();
    renderWorkoutHistory();
    renderWeeklyVolume();
  }

  function saveWorkout() {
    const day = $('trainingDay').value;
    const routine = state.routines[day] || [];
    const exercises = routine.map((e,ei) => {
      const sets = [];
      $$('.setKg').filter(el => Number(el.dataset.e) === ei).forEach((kgEl,si) => {
        const repsEl = document.querySelector(`.setReps[data-e="${ei}"][data-s="${si}"]`);
        const rirEl = document.querySelector(`.setRir[data-e="${ei}"][data-s="${si}"]`);
        sets.push({kg:Number(kgEl.value)||0,reps:Number(repsEl.value)||0,rir:rirEl.value===''?null:Number(rirEl.value)});
      });
      return {name:e[0],targetSets:e[1],targetReps:e[2],sets};
    });
    const completedExercises = exercises.filter(e => e.sets.some(s => s.kg > 0 || s.reps > 0));
    if (!completedExercises.length) return alert('Introduce al menos una serie antes de guardar.');
    const volume = completedExercises.reduce((a,e) => a + e.sets.reduce((b,s) => b+s.kg*s.reps,0),0);
    state.workouts.push({id:Date.now(),date:new Date().toISOString(),day,method:state.preferences.planMethod,goal:state.preferences.planGoal,notes:$('workoutNotes').value.trim(),volume,exercises:completedExercises});
    $('workoutNotes').value = '';
    saveState();
    renderTraining();
    renderHome();
    alert('Entrenamiento guardado. Los datos aparecerán la próxima vez que repitas estos ejercicios.');
  }

  function renderWorkoutHistory() {
    $('workoutHistory').innerHTML = state.workouts.length
      ? state.workouts.slice().reverse().map(w => `<details class="history workoutHistoryItem"><summary><strong>${w.day}</strong><span class="small">${new Date(w.date).toLocaleDateString('es-ES')} · ${Math.round(w.volume).toLocaleString('es-ES')} kg · ${w.exercises.length} ejercicios</span></summary>${w.exercises.map(e=>`<div class="historyExercise"><strong>${e.name}</strong><div class="small">${e.sets.map(s=>`${s.kg} kg × ${s.reps}${s.rir===null?'':` · RIR ${s.rir}`}`).join(' | ')}</div></div>`).join('')}${w.notes?`<div class="small"><strong>Notas:</strong> ${w.notes}</div>`:''}</details>`).join('')
      : `<div class="empty">Sin entrenamientos.</div>`;
  }

  function startTimer() {
    timerLeft = Number(state.settings.rest)||90;
    $('timer').classList.add('active');
    clearInterval(timerId);
    updateTimer();
    timerId = setInterval(() => {
      timerLeft -= 1;
      updateTimer();
      if (timerLeft <= 0) {
        clearInterval(timerId);
        navigator.vibrate?.([120,80,120]);
        alert('Descanso terminado.');
      }
    },1000);
  }
  function updateTimer() {
    $('timerText').textContent = `${String(Math.floor(timerLeft/60)).padStart(2,'0')}:${String(timerLeft%60).padStart(2,'0')}`;
  }
  function stopTimer() {
    clearInterval(timerId);
    $('timer').classList.remove('active');
  }

  function openLibrary() {
    $('libraryModal').classList.add('open');
    populateMuscleFilter();
    renderExerciseLibrary();
  }
  function populateMuscleFilter() {
    const muscles = [...new Set(DATA.exercises.map(e => e.muscle))].sort();
    $('muscleFilter').innerHTML = `<option value="">Todos</option>${muscles.map(m => `<option>${m}</option>`).join('')}`;
  }
  function renderExerciseLibrary() {
    const q = $('exerciseSearch').value.toLowerCase();
    const muscle = $('muscleFilter').value;
    const list = DATA.exercises.filter(e => (!q || JSON.stringify(e).toLowerCase().includes(q)) && (!muscle || e.muscle === muscle));
    $('exerciseLibrary').innerHTML = list.map(e => `<div class="exerciseCard">
      <h3>${e.name}</h3><span class="pill">${e.muscle}</span><span class="pill">${e.equipment}</span><span class="pill">${e.level}</span>
      <div class="small">${e.pattern} · Alternativa: ${e.alt}</div>
      <details style="margin-top:8px"><summary>Técnica</summary><ol>${e.steps.map(s => `<li>${s}</li>`).join('')}</ol><strong class="small">Errores</strong><ol>${e.errors.map(s => `<li>${s}</li>`).join('')}</ol></details>
      <button class="addExercise" data-name="${e.name}" style="width:100%;margin-top:8px">Añadir al día actual</button>
    </div>`).join('');
    $$('.addExercise').forEach(btn => btn.addEventListener('click', () => {
      const day = $('trainingDay').value;
      const ex = DATA.exercises.find(e => e.name === btn.dataset.name);
      state.routines[day] ||= [];
      state.routines[day].push([ex.name,3,'8-12',ex.alt]);
      saveState();
      renderWorkoutList();
      $('libraryModal').classList.remove('open');
    }));
  }

  function showNutritionPanel(name) {
    $$('.nutritionPanel').forEach(p => p.hidden = p.id !== `nutrition-${name}`);
    $$('[data-nutrition-tab]').forEach(b => b.classList.toggle('active', b.dataset.nutritionTab === name));
    if (name === 'diary') renderTodayMeals();
    if (name === 'recipes') renderRecipes();
  }

  function calculateMacros() {
    const equation = $('calcEquation').value;
    const sex = $('calcSex').value;
    const age = Number($('calcAge').value);
    const height = Number($('calcHeight').value);
    const weight = Number($('calcWeight').value);
    const fat = Number($('calcFat').value);
    const activity = Number($('calcActivity').value);
    const goal = $('calcGoal').value;
    if (!age || !height || !weight) return alert('Completa edad, altura y peso.');

    let bmr;
    if (equation === 'katch' && fat > 0) {
      const lbm = weight*(1-fat/100);
      bmr = 370+21.6*lbm;
    } else {
      bmr = 10*weight+6.25*height-5*age+(sex==='m'?5:-161);
    }
    const maintenance = Math.round(bmr*activity);
    const factor = goal === 'loss' ? 0.85 : goal === 'gain' ? 1.07 : goal === 'recomp' ? (fat >= 20 ? 0.93 : 1) : 1;
    const kcal = Math.round(maintenance*factor);
    const proteinFactor = goal === 'loss' ? 2.0 : goal === 'gain' ? 1.8 : 1.9;
    const protein = Math.round(weight*proteinFactor);
    const fatGrams = Math.round(weight*(goal === 'loss' ? 0.8 : 0.9));
    const carbs = Math.max(0,Math.round((kcal-protein*4-fatGrams*9)/4));
    state.targets = {kcal,protein,carbs,fat:fatGrams,maintenance,bmr:Math.round(bmr)};
    saveState();
    renderMacroResult();
    renderHome();
  }

  function renderMacroResult() {
    const t = state.targets;
    $('macroResult').innerHTML = `<div class="card"><div class="grid">
      <div><div class="stat">${t.bmr || '-'}</div><div class="label">metabolismo basal</div></div>
      <div><div class="stat">${t.maintenance || '-'}</div><div class="label">mantenimiento</div></div>
      <div><div class="stat">${t.kcal}</div><div class="label">kcal objetivo</div></div>
      <div><div class="stat">${t.protein} g</div><div class="label">proteína</div></div>
      <div><div class="stat">${t.carbs} g</div><div class="label">carbohidratos</div></div>
      <div><div class="stat">${t.fat} g</div><div class="label">grasas</div></div>
    </div><div class="notice">Es una estimación inicial. Ajusta según la tendencia real de peso durante 2-3 semanas.</div></div>`;
  }

  function chooseRecipe(meal,targetK,targetP,used) {
    const pool = DATA.recipes.filter(r => r.meal === meal && !used.has(r.id));
    const fallback = DATA.recipes.filter(r => r.meal === meal);
    const candidates = pool.length ? pool : fallback;
    candidates.sort((a,b) => (Math.abs(a.kcal-targetK)+Math.abs(a.p-targetP)*7) - (Math.abs(b.kcal-targetK)+Math.abs(b.p-targetP)*7));
    return candidates[0];
  }

  function nutritionPreferences(){return {style:state.preferences.dietStyle||'omnivore',budget:state.preferences.nutritionBudget||'any',maxPrep:Number(state.preferences.nutritionMaxPrep)||0,strategy:state.preferences.calorieStrategy||'flat',excluded:String(state.preferences.excludedIngredients||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean)}}
  function recipeAllowed(r){const p=nutritionPreferences(),hay=`${r.name} ${r.ingredients.join(' ')} ${(r.tags||[]).join(' ')}`.toLowerCase();if(p.maxPrep&&Number(r.time)>p.maxPrep)return false;if(p.excluded.some(x=>hay.includes(x)))return false;if(p.style==='vegetarian'&&!((r.tags||[]).some(t=>/veget/i.test(t))||/tofu|tempeh|huevo|yogur|queso|legumbre|garbanzo|lenteja/.test(hay)))return false;if(p.style==='mediterranean'&&!/mediterr|pollo|pavo|pescado|merluza|bacalao|atún|arroz|legumbre|verdura|yogur/.test(hay))return false;if(p.style==='highprotein'&&r.p<25&&r.meal!=='Merienda')return false;if(p.budget==='low'&&/salmón|gambas|atún fresco|ternera/.test(hay))return false;return true}
  function dayCalorieTarget(dayIndex,days){const base=state.targets.kcal,strategy=state.preferences.calorieStrategy||'flat';if(strategy==='training'){const weekday=(new Date().getDay()+dayIndex)%7;return Math.round(base*(weekday>=1&&weekday<=4?1.05:.95))}if(strategy==='weekend'){const weekday=(new Date().getDay()+dayIndex)%7;return Math.round(base*(weekday===0||weekday===6?1.08:.968));return base}return base}
  function createNutritionPlan(count,days) {
    const mealTypes = count === 4
      ? ['Desayuno','Comida','Merienda','Cena']
      : ['Desayuno','Merienda','Comida','Merienda','Cena'];
    const weights = count === 4 ? [.24,.34,.14,.28] : [.20,.12,.30,.13,.25];
    const usedByMeal = {};

    function pickRecipe(meal,targetK,targetP,dayIndex,mealIndex) {
      const pool = DATA.recipes.filter(r => r.meal === meal);
      if (!pool.length) return null;
      usedByMeal[meal] ||= [];
      const recentlyUsed = new Set(usedByMeal[meal].slice(-Math.min(pool.length-1,8)));
      let candidates = pool.filter(r => !recentlyUsed.has(r.id));
      if (!candidates.length) candidates = pool;
      candidates.sort((a,b) => {
        const scoreA = Math.abs(a.kcal-targetK)+Math.abs(a.p-targetP)*7;
        const scoreB = Math.abs(b.kcal-targetK)+Math.abs(b.p-targetP)*7;
        return scoreA-scoreB;
      });
      const best = candidates.slice(0,Math.min(4,candidates.length));
      const selected = best[(dayIndex+mealIndex*2)%best.length] || candidates[0];
      usedByMeal[meal].push(selected.id);
      return selected;
    }

    function fitDay(recipes) {
      let fitted = recipes.map((r,i) => {
        const targetK = currentDayTarget*weights[i];
        const targetP = state.targets.protein*weights[i];
        const scale = Math.max(.5,Math.min(2,(targetK/r.kcal)*.78+(targetP/r.p)*.22));
        return {recipeId:r.id,meal:mealTypes[i],scale};
      });
      for (let pass=0;pass<4;pass++) {
        const total = fitted.reduce((sum,item) => {
          const r=DATA.recipes.find(x=>x.id===item.recipeId);
          return sum+r.kcal*item.scale;
        },0);
        const correction=currentDayTarget/Math.max(1,total);
        fitted=fitted.map(item=>({...item,scale:Math.max(.5,Math.min(2,item.scale*correction))}));
      }
      return fitted;
    }

    const startDate = new Date();
    startDate.setHours(12,0,0,0);
    const planDays = Array.from({length:days},(_,dayIndex) => {
      const currentDayTarget=dayCalorieTarget(dayIndex,days);const recipes = mealTypes.map((meal,i)=>pickRecipe(meal,currentDayTarget*weights[i],state.targets.protein*weights[i],dayIndex,i)).filter(Boolean);
      const meals = fitDay(recipes);
      const totals = meals.reduce((sum,item)=>{
        const r=DATA.recipes.find(x=>x.id===item.recipeId);
        return {kcal:sum.kcal+Math.round(r.kcal*item.scale),p:sum.p+Math.round(r.p*item.scale),c:sum.c+Math.round(r.c*item.scale),f:sum.f+Math.round(r.f*item.scale)};
      },{kcal:0,p:0,c:0,f:0});
      const date=new Date(startDate);date.setDate(startDate.getDate()+dayIndex);
      return {index:dayIndex+1,date:date.toISOString().slice(0,10),targetKcal:currentDayTarget,meals,totals};
    });
    return {id:Date.now(),createdAt:new Date().toISOString(),days,mealsPerDay:count,target:{...state.targets},planDays};
  }

  function renderNutritionPlan(plan=state.nutritionPlan) {
    if (!plan?.planDays?.length) return;
    const allRecipes=[];
    $('menuOutput').innerHTML = plan.planDays.map((day,dayIndex) => {
      const date=new Date(`${day.date}T12:00:00`);
      const label=plan.days>=28 ? `Día ${day.index} · ${date.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'})}` : date.toLocaleDateString('es-ES',{weekday:'long',day:'numeric'});
      const weekHeader=plan.days>=28 && dayIndex%7===0 ? `<div class="monthWeekHeader">Semana ${Math.floor(dayIndex/7)+1}</div>` : '';
      const mealsHtml=day.meals.map(item=>{
        const r=DATA.recipes.find(x=>x.id===item.recipeId);if(!r)return '';
        const adjusted={...r,scale:item.scale,scaledIngredients:r.ingredients.map(x=>scaleIngredient(x,item.scale))};allRecipes.push(adjusted);
        return `<div class="history"><strong>${item.meal}: ${r.name}</strong> <span class="portionBadge">x${item.scale.toFixed(2)}</span><div class="small">${Math.round(r.kcal*item.scale)} kcal · P ${Math.round(r.p*item.scale)} · C ${Math.round(r.c*item.scale)} · G ${Math.round(r.f*item.scale)}</div><button class="secondary menuRecipe" data-id="${r.id}" data-scale="${item.scale.toFixed(4)}" style="margin-top:6px;padding:8px 10px">Ver receta ajustada</button></div>`;
      }).join('');
      const deviation=day.totals.kcal-plan.target.kcal;
      return `${weekHeader}<div class="card nutritionDayCard"><div class="dayPlanHead"><h3>${label}</h3><button class="secondary regenerateDay" data-day="${dayIndex}">Cambiar día</button></div>${mealsHtml}<div class="kcal">Total ${day.totals.kcal} kcal · P ${day.totals.p} g · C ${day.totals.c} g · G ${day.totals.f} g</div><div class="small">Objetivo ${day.targetKcal||plan.target.kcal} kcal · desviación ${day.totals.kcal-(day.targetKcal||plan.target.kcal)>0?'+':''}${day.totals.kcal-(day.targetKcal||plan.target.kcal)} kcal</div></div>`;
    }).join('');
    $$('.menuRecipe').forEach(btn=>btn.addEventListener('click',()=>showMenuRecipe(btn.dataset.id,btn.dataset.scale)));$$('.regenerateDay').forEach(btn=>btn.addEventListener('click',()=>regenerateNutritionDay(Number(btn.dataset.day))));
    renderShoppingList(allRecipes);
    const avg=Math.round(plan.planDays.reduce((a,d)=>a+d.totals.kcal,0)/plan.planDays.length);
    renderMonthlyInsights(plan);if ($('nutritionPlanStatus')) $('nutritionPlanStatus').innerHTML=`<strong>Plan guardado:</strong> ${plan.days} días · media ${avg} kcal/día · creado ${new Date(plan.createdAt).toLocaleDateString('es-ES')}`;
  }

  function regenerateNutritionDay(index){if(!state.nutritionPlan?.planDays?.[index])return;const fresh=createNutritionPlan(state.nutritionPlan.mealsPerDay,1).planDays[0];fresh.index=index+1;fresh.date=state.nutritionPlan.planDays[index].date;state.nutritionPlan.planDays[index]=fresh;saveState();renderNutritionPlan()}
  function renderMonthlyInsights(plan){const box=$('monthlyPlanInsights');if(!box)return;if(plan.days<28){box.hidden=true;return}const ids=plan.planDays.flatMap(d=>d.meals.map(m=>m.recipeId)),unique=new Set(ids).size,avgP=Math.round(plan.planDays.reduce((a,d)=>a+d.totals.p,0)/plan.days),maxDev=Math.max(...plan.planDays.map(d=>Math.abs(d.totals.kcal-(d.targetKcal||plan.target.kcal))));box.hidden=false;box.innerHTML=`<h3>Calidad del plan mensual</h3><div class="kpiGrid"><div><div class="stat">${unique}</div><div class="label">recetas distintas</div></div><div><div class="stat">${avgP} g</div><div class="label">proteína media</div></div><div><div class="stat">±${maxDev}</div><div class="label">máx. desviación kcal</div></div><div><div class="stat">${Math.round(unique/ids.length*100)}%</div><div class="label">variedad</div></div></div>`}
  function generateMenu() {
    const count=Number($('menuMeals').value);
    const days=Number($('menuDays').value);
    state.nutritionPlan=createNutritionPlan(count,days);
    savePreferences();
    saveState();
    renderNutritionPlan();
  }

  function renderShoppingList(recipes) {
    const items = [...new Set(recipes.flatMap(r => r.scaledIngredients || r.ingredients))];
    $('shoppingList').innerHTML = items.length ? items.map(i => `<label class="history"><input type="checkbox" style="width:auto;margin-right:8px"> ${i}</label>`).join('') : `<div class="empty">Sin elementos.</div>`;
  }

  function addMeal() {
    const meal = {
      id:Date.now(),date:todayKey(),type:$('mealType').value,name:$('mealName').value.trim() || 'Comida',
      kcal:Number($('mealKcal').value)||0,p:Number($('mealProtein').value)||0,c:Number($('mealCarbs').value)||0,f:Number($('mealFat').value)||0
    };
    state.meals.push(meal);
    ['mealName','mealKcal','mealProtein','mealCarbs','mealFat'].forEach(id => $(id).value='');
    saveState();
    renderTodayMeals();
    renderHome();
  }

  function renderTodayMeals() {
    const list = state.meals.filter(m => m.date === todayKey());
    $('todayMeals').innerHTML = list.length ? list.map(m => `<div class="history"><strong>${m.type}: ${m.name}</strong><div class="small">${m.kcal} kcal · P ${m.p} · C ${m.c} · G ${m.f}</div><button class="danger deleteMeal" data-id="${m.id}" style="margin-top:6px;padding:7px 9px">Eliminar</button></div>`).join('') : `<div class="empty">Sin comidas registradas hoy.</div>`;
    $$('.deleteMeal').forEach(btn => btn.addEventListener('click', () => {
      state.meals = state.meals.filter(m => m.id !== Number(btn.dataset.id));
      saveState();
      renderTodayMeals();
      renderHome();
    }));
  }

  function renderRecipes() {
    const q = $('recipeSearch').value.toLowerCase().trim();
    const meal = $('recipeMealFilter')?.value || '';
    const maxTime = Number($('recipeTimeFilter')?.value) || Infinity;
    const list = DATA.recipes.filter(r => {
      const matchesText = !q || JSON.stringify(r).toLowerCase().includes(q);
      return matchesText && (!meal || r.meal === meal) && (!r.time || r.time <= maxTime);
    });
    if ($('recipeCount')) $('recipeCount').textContent = `${list.length} de ${DATA.recipes.length} recetas · originales y escalables por porción`;
    $('recipeList').innerHTML = list.map(r => `<div class="recipeCard">
      <h3>${r.name}</h3><span class="pill">${r.meal}</span>${r.cuisine?`<span class="pill secondaryPill">${r.cuisine}</span>`:''}
      <div class="kcal">${r.kcal} kcal</div><div class="small">P ${r.p} g · C ${r.c} g · G ${r.f} g${r.fiber?` · Fibra ${r.fiber} g`:''}</div>
      ${r.time?`<div class="recipeMeta"><span>⏱ ${r.time} min</span><span>${r.difficulty||'Fácil'}</span></div>`:''}
      ${r.tags?.length?`<div class="recipeTags">${r.tags.map(t=>`<span>${t}</span>`).join('')}</div>`:''}
      <div class="recipeSteps"><strong>Ingredientes</strong><div class="small">${r.ingredients.join('<br>')}</div><strong style="display:block;margin-top:9px">Preparación</strong><ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
      <button class="addRecipeMeal" data-id="${r.id}" style="width:100%">Añadir al diario</button>
    </div>`).join('') || '<div class="card empty">No hay recetas que coincidan con los filtros.</div>';
    $$('.addRecipeMeal').forEach(btn => btn.addEventListener('click', () => {
      const r = DATA.recipes.find(x => x.id === btn.dataset.id);
      state.meals.push({id:Date.now(),date:todayKey(),type:r.meal,name:r.name,kcal:r.kcal,p:r.p,c:r.c,f:r.f});
      saveState();
      renderHome();
      alert('Receta añadida al diario.');
    }));
  }

  function renderNutrition() {
    renderMacroResult();
    renderTodayMeals();
    renderRecipes();
    if (state.nutritionPlan) renderNutritionPlan();
  }

  function saveMetric() {
    state.metrics.push({
      id:Date.now(),date:new Date().toISOString(),
      weight:Number($('metricWeight').value)||null,
      fat:Number($('metricFat').value)||null,
      waist:Number($('metricWaist').value)||null,
      chest:Number($('metricChest').value)||null
    });
    ['metricWeight','metricFat','metricWaist','metricChest'].forEach(id => $(id).value='');
    saveState();
    renderProgress();
  }

  function drawWeightChart() {
    const canvas = $('weightChart');
    const ctx = canvas.getContext('2d');
    const points = state.metrics.filter(m => m.weight);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (points.length < 2) {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--muted');
      ctx.font = '22px sans-serif';
      ctx.fillText('Añade al menos 2 registros',190,120);
      return;
    }
    const values = points.map(p => p.weight);
    let min = Math.min(...values), max = Math.max(...values);
    if (min === max) {min -= 1;max += 1}
    const pad = 42;
    ctx.strokeStyle = '#2fd374';
    ctx.lineWidth = 4;
    ctx.beginPath();
    points.forEach((p,i) => {
      const x = pad+i*(canvas.width-pad-20)/(points.length-1);
      const y = 20+(max-p.weight)*(canvas.height-pad-20)/(max-min);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  function preparePhotos(input) {
    pendingPhotos = [...(input.files || [])];
    $('selectedPhotos').textContent = pendingPhotos.length ? `${pendingPhotos.length} foto(s) seleccionada(s)` : 'Ninguna foto seleccionada.';
  }

  async function savePhotos() {
    if (!pendingPhotos.length) return alert('Selecciona una o varias fotos.');
    for (const file of pendingPhotos) {
      if (file.size > 5*1024*1024) continue;
      const data = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      state.photos.push({id:Date.now()+Math.random(),date:new Date().toISOString(),note:$('photoNote').value.trim() || file.name,data});
    }
    pendingPhotos = [];
    $('photoFiles').value = '';
    $('photoCamera').value = '';
    $('photoNote').value = '';
    $('selectedPhotos').textContent = 'Ninguna foto seleccionada.';
    try {
      saveState();
      renderPhotos();
    } catch {
      alert('No hay espacio suficiente. Usa fotos más pequeñas.');
    }
  }

  function renderPhotos() {
    const opts = state.photos.map((p,i) => `<option value="${i}">${new Date(p.date).toLocaleDateString('es-ES')} · ${p.note}</option>`).join('');
    $('photoBefore').innerHTML = opts;
    $('photoAfter').innerHTML = opts;
    if (state.photos.length > 1) $('photoAfter').value = state.photos.length-1;
    renderPhotoCompare();
    $('photoGrid').innerHTML = state.photos.length ? state.photos.slice().reverse().map((p,rev) => {
      const index = state.photos.length-1-rev;
      return `<div class="card"><strong>${new Date(p.date).toLocaleDateString('es-ES')}</strong><div class="small">${p.note}</div><img src="${p.data}"><button class="danger deletePhoto" data-index="${index}" style="width:100%;margin-top:6px">Eliminar</button></div>`;
    }).join('') : `<div class="empty">Sin fotos.</div>`;
    $$('.deletePhoto').forEach(btn => btn.addEventListener('click', () => {
      state.photos.splice(Number(btn.dataset.index),1);
      saveState();
      renderPhotos();
    }));
  }

  function renderPhotoCompare() {
    if (state.photos.length < 2) {
      $('photoCompare').innerHTML = `<div class="empty">Añade dos fotos.</div>`;
      return;
    }
    const before = state.photos[Number($('photoBefore').value)||0];
    const after = state.photos[Number($('photoAfter').value)||state.photos.length-1];
    $('photoCompare').innerHTML = `<div><div class="small">ANTES</div><img src="${before.data}"><div class="small">${before.note}</div></div><div><div class="small">DESPUÉS</div><img src="${after.data}"><div class="small">${after.note}</div></div>`;
  }

  function renderMetricHistory() {
    $('metricHistory').innerHTML = state.metrics.length ? state.metrics.slice().reverse().map(m => `<div class="history"><strong>${new Date(m.date).toLocaleDateString('es-ES')}</strong><div class="small">${m.weight ?? '-'} kg · grasa ${m.fat ?? '-'}% · cintura ${m.waist ?? '-'} cm · pecho ${m.chest ?? '-'} cm</div></div>`).join('') : `<div class="empty">Sin métricas.</div>`;
  }

  function renderProgress() {
    drawWeightChart();
    renderPhotos();
    renderMetricHistory();renderMonthlyReport();
  }

  function renderSettings() {
    $('profileName').value = state.profile.name || '';
    restorePreferences();
    $('restSeconds').value = state.settings.rest;
    $('theme').value = state.settings.theme;
    renderAchievements();
    $('weeklySessionGoal').value = state.settings.weeklySessionGoal || 4;
    $('stepGoal').value = state.settings.stepGoal || 8000;
  }

  function saveSettings() {
    state.profile.name = $('profileName').value.trim() || 'Agustín';
    state.settings.rest = Number($('restSeconds').value);
    state.settings.theme = $('theme').value;
    saveState();
    applyTheme();
    renderHome();
    alert('Ajustes guardados.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitcoach-backup-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Formato no válido');
        const arrayKeys = ['workouts','meals','metrics','photos','recovery'];
        const objectKeys = ['profile','settings','targets','routines','preferences'];
        arrayKeys.forEach(key => { if (key in data && !Array.isArray(data[key])) throw new Error(`Campo ${key} no válido`); });
        objectKeys.forEach(key => { if (key in data && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))) throw new Error(`Campo ${key} no válido`); });
        state = {...state,...data};
        saveState();
        applyTheme();
        renderAll();
        alert('Datos importados.');
      } catch {
        alert('Archivo no válido.');
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!confirm('¿Borrar todos los datos locales?')) return;
    Object.keys(defaults).forEach(k => localStorage.removeItem(k));
    state = JSON.parse(JSON.stringify(defaults));
    saveState();
    renderAll();
  }


  function crossFilteredWods() {
    const q = ($('crossSearch')?.value || '').trim().toLowerCase();
    const format = $('crossFormat')?.value || '';
    const level = $('crossLevel')?.value || '';
    const equipment = $('crossEquipment')?.value || '';
    const maxDuration = Number($('crossDuration')?.value || 0);
    return CROSS_WODS.filter(w => {
      const haystack = [w.name,w.format,w.level,w.description,...w.equipment,...w.movements.map(m=>m.movement)].join(' ').toLowerCase();
      return (!q || haystack.includes(q)) && (!format || w.format === format) && (!level || w.level === level) && (!equipment || w.equipment.includes(equipment)) && (!maxDuration || w.duration <= maxDuration);
    });
  }

  function crossWodCard(w) {
    return `<article class="card crossWod" data-cross-id="${w.id}">
      <div class="crossHead"><div><span class="pill">${w.format}</span><h3>${w.name}</h3></div><strong>${w.duration} min</strong></div>
      <div class="recipeTags">${w.equipment.map(e=>`<span>${e}</span>`).join('')}</div>
      <div class="small">${w.level} · ${w.description}</div>
      <ol class="crossMoves">${w.movements.map(m=>`<li><strong>${m.dose}</strong> ${m.movement}</li>`).join('')}</ol>
      <div class="row"><button class="crossStart" data-cross-id="${w.id}">Iniciar / registrar</button><button class="secondary crossCopy" data-cross-id="${w.id}">Copiar</button></div>
    </article>`;
  }

  function renderCrossTraining() {
    if (!$('crossWodList')) return;
    const items = crossFilteredWods();
    $('crossCount').textContent = `${items.length} WODs compatibles de ${CROSS_WODS.length} disponibles.`;
    $('crossWodList').innerHTML = items.slice(0,120).map(crossWodCard).join('') || '<div class="card empty">No hay WODs con estos filtros. Prueba a ampliar material, nivel o duración.</div>';
    const history = [...state.crossHistory].reverse();
    $('crossHistory').innerHTML = history.length ? history.slice(0,20).map(h=>`<details class="workoutHistoryItem"><summary><strong>${h.name}</strong><span class="small">${h.date} · ${h.result}</span></summary><div class="small" style="margin-top:8px">${h.notes || 'Sin notas'} · ${h.format}</div></details>`).join('') : '<div class="empty">Todavía no has registrado WODs.</div>';
  }

  function startCrossWod(id) {
    const w = CROSS_WODS.find(x=>x.id===id); if(!w) return;
    const result = prompt(`Resultado de ${w.name}\nEjemplos: 5+12 rondas/reps, 18:42, 180 repeticiones`, 'Completado');
    if (result === null) return;
    const notes = prompt('Notas, escalado o sensaciones:', '') || '';
    state.crossHistory.push({id:Date.now(),wodId:w.id,name:w.name,format:w.format,date:todayKey(),result:result.trim()||'Completado',notes});
    saveState(); renderCrossTraining(); renderHome();
    alert('WOD guardado. Podrás consultarlo en el historial.');
  }

  async function copyCrossWod(id) {
    const w=CROSS_WODS.find(x=>x.id===id); if(!w) return;
    const text=`${w.name} · ${w.format} · ${w.description}\n${w.movements.map(m=>`${m.dose} ${m.movement}`).join('\n')}\nMaterial: ${w.equipment.join(', ')}`;
    try { await navigator.clipboard.writeText(text); alert('WOD copiado.'); }
    catch { prompt('Copia el WOD:', text); }
  }

  function randomCrossWod() {
    const items=crossFilteredWods();
    if(!items.length){alert('No hay WODs compatibles con estos filtros.');return;}
    const w=items[Math.floor(Math.random()*items.length)];
    $('crossWodList').innerHTML=crossWodCard(w);
    $('crossCount').textContent=`WOD aleatorio compatible · ${items.length} opciones posibles.`;
    window.scrollTo({top:$('crossWodList').offsetTop-90,behavior:'smooth'});
  }

  function bindEvents() {
    $$('nav button').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    $$('[data-go]').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.go)));
    $$('[data-nutrition-tab]').forEach(btn => btn.addEventListener('click', () => showNutritionPanel(btn.dataset.nutritionTab)));

    $('generatePlan').addEventListener('click', generatePlan);
    $('planMethod').addEventListener('change',()=>{renderPlanEvidence();savePreferences()});
    preferenceFields().forEach(id=>{const el=$(id);if(el)el.addEventListener('change',savePreferences)});
    $('closeMenuRecipe').addEventListener('click',()=>$('menuRecipeModal').classList.remove('open'));
    $('trainingDay').addEventListener('change', renderWorkoutList);
    $('saveWorkout').addEventListener('click', saveWorkout);
    $('openLibrary').addEventListener('click', openLibrary);
    $('closeLibrary').addEventListener('click', () => $('libraryModal').classList.remove('open'));
    $('closeEquivalent').addEventListener('click', () => $('equivalentModal').classList.remove('open'));$('equivalentSearch').addEventListener('input',renderEquivalentOptions);$('equivalentEquipment').addEventListener('change',renderEquivalentOptions);
    $('exerciseSearch').addEventListener('input', renderExerciseLibrary);
    $('muscleFilter').addEventListener('change', renderExerciseLibrary);
    $('timerAdd').addEventListener('click', () => {timerLeft += 30;updateTimer()});
    $('timerStop').addEventListener('click', stopTimer);

    $('calculateMacros').addEventListener('click', calculateMacros);
    $('generateMenu').addEventListener('click', generateMenu);
    $('addMeal').addEventListener('click', addMeal);
    $('recipeSearch').addEventListener('input', renderRecipes);
    $('recipeMealFilter').addEventListener('change', renderRecipes);
    $('recipeTimeFilter').addEventListener('change', renderRecipes);

    $('saveMetric').addEventListener('click', saveMetric);
    $('saveRecovery').addEventListener('click', saveRecovery);
    $('calendarPrev').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar()});
    $('calendarNext').addEventListener('click',()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar()});
    $('photoFiles').addEventListener('change', e => preparePhotos(e.target));
    $('photoCamera').addEventListener('change', e => preparePhotos(e.target));
    $('savePhotos').addEventListener('click', savePhotos);
    $('photoBefore').addEventListener('change', renderPhotoCompare);
    $('photoAfter').addEventListener('change', renderPhotoCompare);

    $('saveSettings').addEventListener('click', saveSettings);
    $('exportData').addEventListener('click', exportData);
    $('importData').addEventListener('change', e => importData(e.target.files[0]));
    $('resetData').addEventListener('click', resetData);
    $('openPrivacy').addEventListener('click',()=>openLegal('privacy'));
    $('openTerms').addEventListener('click',()=>openLegal('terms'));
    $('closeLegal').addEventListener('click',()=>$('legalModal').classList.remove('open'));
    $('shareApp').addEventListener('click',shareApp);
    $('finishOnboarding').addEventListener('click',finishOnboarding);
    $('applyPriority').addEventListener('click', applyPriorityToPlan);
    $('analyzeProgression').addEventListener('click', analyzeProgression);
    $('refreshWeeklyVolume').addEventListener('click', renderWeeklyVolume);
    $('generatePortionMenu').addEventListener('click', generatePortionMenu);
    $('saveProgressPrefs').addEventListener('click',()=>{state.settings.weeklySessionGoal=+$('weeklySessionGoal').value;state.settings.stepGoal=+$('stepGoal').value||8000;saveState();renderHome();alert('Preferencias guardadas.')});
    ['crossSearch','crossFormat','crossLevel','crossEquipment','crossDuration'].forEach(id=>$(id)?.addEventListener(id==='crossSearch'?'input':'change',renderCrossTraining));
    $('crossRandom')?.addEventListener('click',randomCrossWod);
    $('crossReset')?.addEventListener('click',()=>{['crossSearch','crossFormat','crossLevel','crossEquipment','crossDuration'].forEach(id=>{const el=$(id);if(el)el.value=id==='crossDuration'?'0':''});renderCrossTraining()});
    $('crossWodList')?.addEventListener('click',e=>{const start=e.target.closest('.crossStart'),copy=e.target.closest('.crossCopy');if(start)startCrossWod(start.dataset.crossId);if(copy)copyCrossWod(copy.dataset.crossId)});
  }

  function renderAll() {
    applyTheme();
    renderHome();
    renderTraining();
    renderNutrition();
    renderProgress();
    renderSettings();
    renderCrossTraining();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('./sw.js?v=1.6.1', {updateViaCache:'none'}).then(registration => {
      const banner = $('updateBanner');
      const updateButton = $('updateApp');
      const showUpdate = worker => {
        if (!worker || !banner || !updateButton) return;
        banner.hidden = false;
        updateButton.onclick = () => worker.postMessage({type:'SKIP_WAITING'});
      };
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      registration.update().catch(() => {});
      window.addEventListener('online', () => registration.update().catch(() => {}));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    }).catch(() => {});
  }

  function init() {
    bindEvents();
    restorePreferences();
    renderAll();
    maybeOnboarding();
    registerServiceWorker();
  }

  document.addEventListener('DOMContentLoaded', init);
})();