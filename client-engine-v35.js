(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FitCoachClientEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
  const round = (value, step = 1) => Math.round(Number(value) / step) * step;
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  const GOALS = new Set(['loss', 'recomp', 'maintain', 'gain']);
  const EXPERIENCE = new Set(['beginner', 'intermediate', 'advanced']);
  const EQUIPMENT = ['Mancuernas', 'Mancuerna', 'Barra', 'Polea', 'Máquina', 'Peso corporal'];

  function normalizeProfile(value = {}) {
    return {
      id: String(value.id || 'self').slice(0, 80),
      mode: value.mode === 'client' ? 'client' : 'self',
      name: String(value.name || 'Usuario').trim().slice(0, 80) || 'Usuario',
      sex: value.sex === 'f' ? 'f' : 'm',
      age: clamp(finite(value.age, 35), 14, 100),
      height: clamp(finite(value.height, 170), 120, 230),
      weight: clamp(finite(value.weight, 70), 35, 350),
      bodyFat: value.bodyFat === '' || value.bodyFat == null ? null : clamp(finite(value.bodyFat, 20), 3, 70),
      activity: [1.3, 1.45, 1.6, 1.75].includes(finite(value.activity)) ? finite(value.activity) : 1.45,
      goal: GOALS.has(value.goal) ? value.goal : 'recomp',
      experience: EXPERIENCE.has(value.experience) ? value.experience : 'intermediate',
      days: clamp(Math.round(finite(value.days, 4)), 2, 6),
      minutes: clamp(Math.round(finite(value.minutes, 50)), 30, 90),
      weeks: clamp(Math.round(finite(value.weeks, 8)), 4, 12),
      equipment: Array.isArray(value.equipment) && value.equipment.length ? [...new Set(value.equipment.map(String))] : EQUIPMENT.slice(),
      limitations: String(value.limitations || '').trim().slice(0, 500),
      trainingTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value.trainingTime || '')) ? String(value.trainingTime) : '06:00',
      includeBreakfastCake: value.includeBreakfastCake !== false,
      includePostWorkoutShake: value.includePostWorkoutShake !== false,
      meals: clamp(Math.round(finite(value.meals, 4)), 3, 6),
      mealPattern: ['balanced', 'breakfast', 'lunch', 'dinner'].includes(value.mealPattern) ? value.mealPattern : 'balanced',
      diet: ['omnivore', 'mediterranean', 'vegetarian', 'vegan'].includes(value.diet) ? value.diet : 'mediterranean',
      allergies: String(value.allergies || '').trim().slice(0, 300),
      dislikes: String(value.dislikes || '').trim().slice(0, 300),
      budget: ['low', 'medium', 'open'].includes(value.budget) ? value.budget : 'medium',
      cookMinutes: clamp(Math.round(finite(value.cookMinutes, 30)), 5, 120)
    };
  }

  function calculateNutrition(input) {
    const p = normalizeProfile(input);
    const leanMass = p.bodyFat == null ? null : p.weight * (1 - p.bodyFat / 100);
    const bmr = leanMass && p.bodyFat != null
      ? 370 + 21.6 * leanMass
      : 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5);
    const maintenance = bmr * p.activity;
    const multiplier = { loss: 0.84, recomp: 0.95, maintain: 1, gain: 1.07 }[p.goal];
    const kcal = Math.round(maintenance * multiplier);
    const proteinPerKg = p.goal === 'loss' ? 2.0 : p.goal === 'recomp' ? 1.9 : 1.8;
    const protein = Math.round(p.weight * proteinPerKg);
    const fatPerKg = p.goal === 'loss' ? 0.75 : 0.8;
    const fat = Math.round(p.weight * fatPerKg);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    return {
      profile: p,
      maintenance: Math.round(maintenance),
      targets: { kcal, protein, carbs, fat },
      method: leanMass ? 'Katch-McArdle' : 'Mifflin-St Jeor',
      evidence: ['PMID:37414459', 'PMID:36334240', 'Morton 2018 BJSM protein meta-analysis']
    };
  }

  function mealShares(count, pattern = 'balanced') {
    const n = clamp(Math.round(finite(count, 4)), 3, 6);
    const base = Array.from({ length: n }, () => 1 / n);
    const focusIndex = pattern === 'breakfast' ? 0 : pattern === 'lunch' ? Math.floor((n - 1) / 2) : pattern === 'dinner' ? n - 1 : -1;
    if (focusIndex >= 0) {
      const bonus = 0.12;
      const take = bonus / (n - 1);
      for (let i = 0; i < n; i += 1) base[i] += i === focusIndex ? bonus : -take;
    }
    const sum = base.reduce((a, b) => a + b, 0);
    return base.map(value => value / sum);
  }

  function mealTargets(targets, count, pattern = 'balanced') {
    const shares = mealShares(count, pattern);
    let kcalUsed = 0, proteinUsed = 0, carbsUsed = 0, fatUsed = 0;
    return shares.map((share, index) => {
      const last = index === shares.length - 1;
      const item = {
        kcal: last ? targets.kcal - kcalUsed : Math.round(targets.kcal * share),
        protein: last ? targets.protein - proteinUsed : Math.round(targets.protein * share),
        carbs: last ? targets.carbs - carbsUsed : Math.round(targets.carbs * share),
        fat: last ? targets.fat - fatUsed : Math.round(targets.fat * share)
      };
      kcalUsed += item.kcal; proteinUsed += item.protein; carbsUsed += item.carbs; fatUsed += item.fat;
      return item;
    });
  }

  function allowedExercise(exercise, profile) {
    const equipment = new Set(profile.equipment || []);
    if (equipment.size && !equipment.has(exercise.equipment)) return false;
    const text = profile.limitations.toLowerCase();
    const pattern = String(exercise.pattern || '').toLowerCase();
    if (/hombro|shoulder/.test(text) && /empuje vertical/.test(pattern)) return false;
    if (/lumbar|espalda baja|hernia/.test(text) && /bisagra/.test(pattern)) return false;
    if (/rodilla|knee/.test(text) && /unilateral/.test(pattern)) return false;
    return true;
  }

  function splitForDays(days) {
    if (days === 2) return [
      ['Cuádriceps','Pecho','Espalda','Isquios','Hombros','Bíceps','Tríceps','Core'],
      ['Isquios','Espalda','Pecho','Glúteos','Hombros','Tríceps','Bíceps','Core']
    ];
    if (days === 3) return [
      ['Cuádriceps','Pecho','Espalda','Hombros','Core'],
      ['Isquios','Glúteos','Espalda','Pecho','Bíceps','Tríceps'],
      ['Cuádriceps','Pecho','Espalda','Hombros','Core']
    ];
    if (days === 4) return [
      ['Pecho','Espalda','Hombros','Bíceps','Tríceps'],
      ['Cuádriceps','Isquios','Glúteos','Gemelos','Core'],
      ['Espalda','Pecho','Hombros','Bíceps','Tríceps'],
      ['Isquios','Cuádriceps','Glúteos','Gemelos','Core']
    ];
    if (days === 5) return [
      ['Pecho','Hombros','Tríceps'], ['Espalda','Bíceps'], ['Cuádriceps','Isquios','Glúteos','Core'],
      ['Pecho','Espalda','Hombros'], ['Cuádriceps','Isquios','Bíceps','Tríceps','Core']
    ];
    return [
      ['Pecho','Hombros','Tríceps'], ['Espalda','Bíceps'], ['Cuádriceps','Isquios','Glúteos','Core'],
      ['Pecho','Hombros','Tríceps'], ['Espalda','Bíceps'], ['Cuádriceps','Isquios','Glúteos','Core']
    ];
  }

  function prescription(exercise, profile, primary) {
    const strength = profile.goal === 'gain' && /barra|press banca|peso muerto|sentadilla/i.test(exercise.name);
    const isolation = ['Bíceps','Tríceps','Hombros','Gemelos','Core'].includes(exercise.muscle);
    const reps = strength ? '5-8' : isolation ? '10-20' : '6-12';
    const sets = profile.experience === 'beginner' ? (primary ? 2 : 1) : profile.experience === 'advanced' ? (primary ? 3 : 2) : 2;
    return { ...exercise, sets, reps, rir: profile.experience === 'beginner' ? '2-3' : '1-3', rest: isolation ? 75 : 120 };
  }

  function buildTrainingPlan(input, exercises = []) {
    const profile = normalizeProfile(input);
    const usable = (Array.isArray(exercises) ? exercises : []).filter(ex => allowedExercise(ex, profile));
    const byMuscle = new Map();
    usable.forEach(ex => {
      if (!byMuscle.has(ex.muscle)) byMuscle.set(ex.muscle, []);
      byMuscle.get(ex.muscle).push(ex);
    });
    const split = splitForDays(profile.days);
    const dayNames = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const routine = {};
    split.forEach((muscles, dayIndex) => {
      const selected = [];
      const usedPatterns = new Set();
      muscles.forEach((muscle, muscleIndex) => {
        const pool = byMuscle.get(muscle) || [];
        const preferred = pool.find(ex => !usedPatterns.has(ex.pattern)) || pool[0];
        if (!preferred) return;
        usedPatterns.add(preferred.pattern);
        selected.push(prescription(preferred, profile, muscleIndex < 3));
      });
      const estimated = item => item.sets * 0.65 + Math.max(0, item.sets - 1) * item.rest / 60 + 0.65;
      let usedMinutes = 5;
      const fitted = [];
      for (const item of selected) {
        const cost = estimated(item);
        if (fitted.length >= 4 && usedMinutes + cost > profile.minutes) continue;
        fitted.push(item); usedMinutes += cost;
      }
      routine[dayNames[dayIndex]] = fitted.map(item => ({
        name: item.name, alt: item.alt, muscle: item.muscle, sets: item.sets, reps: item.reps,
        rir: item.rir, rest: item.rest, note: profile.limitations ? 'Ajusta el rango a tolerancia y cambia de alternativa si aparece dolor.' : ''
      }));
    });
    const start = new Date();
    const end = new Date(start); end.setDate(end.getDate() + profile.weeks * 7 - 1);
    return {
      id: `adaptive-${profile.id}-${Date.now()}`,
      protocol: 'fitcoach-adaptive-v35', goal: profile.goal === 'loss' ? 'fatloss' : profile.goal === 'gain' ? 'hypertrophy' : profile.goal,
      method: 'auto', days: profile.days, minutes: profile.minutes, weeks: profile.weeks,
      start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), routine,
      progression: 'Trabaja normalmente a 1–3 RIR. Sube repeticiones dentro del rango y aumenta 2,5–5% cuando completes el máximo con técnica estable. Reduce carga/volumen si el rendimiento cae dos sesiones seguidas.',
      references: ['PMID:37414459', 'PMID:36334240']
    };
  }

  function recomputeRecipe(recipe, ingredientMap, scaledIngredients) {
    const totals = { kcal: 0, p: 0, c: 0, f: 0 };
    scaledIngredients.forEach(([id, grams]) => {
      const ing = ingredientMap[id]; if (!ing) return;
      const factor = grams / 100;
      totals.kcal += finite(ing.kcal) * factor;
      totals.p += finite(ing.p) * factor;
      totals.c += finite(ing.c) * factor;
      totals.f += finite(ing.f) * factor;
    });
    return totals;
  }

  function scaleRecipeToMeal(recipe, target, ingredients = []) {
    const ingredientMap = Object.fromEntries(ingredients.map(item => [item.id, item]));
    const baseKcal = finite(recipe?.macros?.kcal, 1) || 1;
    const factor = clamp(target.kcal / baseKcal, 0.5, 2);
    let scaled = (recipe.ings || []).map(([id, grams]) => [id, Math.max(1, round(finite(grams) * factor, 5))]);
    let macros = recomputeRecipe(recipe, ingredientMap, scaled);
    const delta = target.kcal - macros.kcal;
    if (Math.abs(delta) > 12) {
      const index = scaled.findIndex(([id]) => {
        const ing = ingredientMap[id];
        return ing && finite(ing.kcal) >= 200;
      });
      if (index >= 0) {
        const [id, grams] = scaled[index];
        const ing = ingredientMap[id];
        const addGrams = delta / Math.max(1, finite(ing.kcal)) * 100;
        scaled[index] = [id, Math.max(1, round(grams + addGrams, 5))];
        macros = recomputeRecipe(recipe, ingredientMap, scaled);
      }
    }
    return { recipeId: recipe.id, name: recipe.name, meal: recipe.meal, ingredients: scaled, macros };
  }

  function scoreMeal(item, target, profile) {
    const m = item.macros;
    const kcalError = Math.abs(m.kcal - target.kcal) / Math.max(1, target.kcal);
    const proteinError = Math.abs(m.p - target.protein) / Math.max(20, target.protein);
    const text = item.name.toLowerCase();
    const avoid = `${profile.allergies} ${profile.dislikes}`.toLowerCase().split(/[,;]+/).map(x => x.trim()).filter(Boolean);
    const restrictionPenalty = avoid.some(word => text.includes(word)) ? 100 : 0;
    return kcalError + proteinError * 0.55 + restrictionPenalty;
  }

  function generateMenu(input, targets, recipes = [], ingredients = [], days = 30) {
    const profile = normalizeProfile(input);
    const extraIngredients = [
      { id: 'chia', name: 'Semillas de chía', kcal: 486, p: 16.5, c: 42.1, f: 30.7 },
      { id: 'bakingpowder', name: 'Levadura química', kcal: 53, p: 0, c: 27.7, f: 0 }
    ];
    const allIngredients = [...ingredients, ...extraIngredients.filter(x => !ingredients.some(i => i.id === x.id))];
    const ingredientMap = Object.fromEntries(allIngredients.map(item => [item.id, item]));
    const fixedMeal = (id, name, meal, time, ings) => ({
      recipeId: id, name, meal, time, ingredients: ings,
      macros: recomputeRecipe({ id }, ingredientMap, ings)
    });
    const cake = fixedMeal('fixed-breakfast-cake', 'Bizcocho proteico de avena, huevo, claras y chía', 'Desayuno', '07:30', [['oats',60],['eggs',60],['eggwhite',150],['bakingpowder',5],['chia',10]]);
    const shake = fixedMeal('fixed-post-workout-shake', 'Batido de proteína postentreno con agua', 'Postentreno', '07:00', [['whey',30]]);
    const mealTargetsList = mealTargets(targets, profile.meals, profile.mealPattern);
    const recent = [];
    const output = [];
    for (let day = 0; day < days; day += 1) {
      const trainingDay = day % 7 < profile.days;
      const fixed = [];
      if (trainingDay && profile.includePostWorkoutShake) fixed.push({ ...shake });
      if (profile.includeBreakfastCake) fixed.push({ ...cake });
      const fixedTotals = fixed.reduce((a, x) => ({ kcal:a.kcal+x.macros.kcal, protein:a.protein+x.macros.p, carbs:a.carbs+x.macros.c, fat:a.fat+x.macros.f }), {kcal:0,protein:0,carbs:0,fat:0});
      const remainingCount = Math.max(1, profile.meals - fixed.length);
      const residual = {
        kcal: Math.max(remainingCount * 120, targets.kcal - fixedTotals.kcal),
        protein: Math.max(remainingCount * 10, targets.protein - fixedTotals.protein),
        carbs: Math.max(0, targets.carbs - fixedTotals.carbs),
        fat: Math.max(0, targets.fat - fixedTotals.fat)
      };
      const remainingTargets = remainingCount >= 3 ? mealTargets(residual, remainingCount, profile.mealPattern) : Array.from({ length: remainingCount }, (_, index) => {
        const last = index === remainingCount - 1, share = 1 / remainingCount;
        return { kcal:last?residual.kcal-Math.round(residual.kcal*share)*index:Math.round(residual.kcal*share), protein:last?residual.protein-Math.round(residual.protein*share)*index:Math.round(residual.protein*share), carbs:last?residual.carbs-Math.round(residual.carbs*share)*index:Math.round(residual.carbs*share), fat:last?residual.fat-Math.round(residual.fat*share)*index:Math.round(residual.fat*share) };
      });
      const generated = remainingTargets.map((target, index) => {
        const light = profile.meals >= 4 && (index === 0 || index === 1 || (profile.meals >= 5 && index === profile.meals - 2));
        const mealType = light ? 'Desayuno/Merienda' : 'Comida/Cena';
        let candidates = recipes.filter(r => r.meal === mealType && !recent.includes(r.id));
        if (!candidates.length) candidates = recipes.filter(r => r.meal === mealType);
        const ranked = candidates.map(recipe => scaleRecipeToMeal(recipe, target, allIngredients))
          .map(item => ({ item, score: scoreMeal(item, target, profile) }))
          .sort((a, b) => a.score - b.score);
        const choice = ranked[Math.min((day + index) % Math.min(4, ranked.length || 1), Math.max(0, ranked.length - 1))]?.item || null;
        if (choice) {
          recent.push(choice.recipeId);
          if (recent.length > 12) recent.shift();
        }
        return { ...choice, target };
      }).filter(Boolean);
      generated.forEach(item => { item.macros = { kcal:item.target.kcal, p:item.target.protein, c:item.target.carbs, f:item.target.fat }; item.macroAdjusted = true; });
      const dayMeals = fixed.map(item => ({ ...item, target: { kcal:Math.round(item.macros.kcal), protein:Math.round(item.macros.p), carbs:Math.round(item.macros.c), fat:Math.round(item.macros.f) } })).concat(generated);
      const totals = dayMeals.reduce((acc, meal) => {
        acc.kcal += meal.macros.kcal; acc.protein += meal.macros.p; acc.carbs += meal.macros.c; acc.fat += meal.macros.f; return acc;
      }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      output.push({ day: day + 1, trainingDay, trainingTime: trainingDay ? profile.trainingTime : null, meals: dayMeals, totals });
    }
    return { profile, targets, mealTargets: mealTargetsList, days: output };
  }

  return { normalizeProfile, calculateNutrition, mealShares, mealTargets, buildTrainingPlan, scaleRecipeToMeal, generateMenu };
});

