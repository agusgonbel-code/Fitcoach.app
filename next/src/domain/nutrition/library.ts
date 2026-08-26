import type { IngredientDefinition, RecipeDefinition } from './recipePlanner';

export const CORE_INGREDIENTS: IngredientDefinition[] = [
  { id: 'oats', name: 'Avena', kcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9 },
  { id: 'egg', name: 'Huevo entero', kcal: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5 },
  { id: 'eggwhite', name: 'Claras de huevo', kcal: 52, proteinG: 10.9, carbsG: 0.7, fatG: 0.2 },
  { id: 'skyr', name: 'Skyr natural', kcal: 63, proteinG: 11, carbsG: 4, fatG: 0.2 },
  { id: 'banana', name: 'Plátano', kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3 },
  { id: 'chicken', name: 'Pechuga de pollo', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { id: 'rice', name: 'Arroz cocido', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { id: 'potato', name: 'Patata cocida', kcal: 87, proteinG: 1.9, carbsG: 20.1, fatG: 0.1 },
  { id: 'broccoli', name: 'Brócoli', kcal: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4 },
  { id: 'oliveoil', name: 'Aceite de oliva', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { id: 'tuna', name: 'Atún al natural', kcal: 116, proteinG: 25.5, carbsG: 0, fatG: 0.8 },
  { id: 'bread', name: 'Pan integral', kcal: 247, proteinG: 13, carbsG: 41, fatG: 4.2 },
  { id: 'tomato', name: 'Tomate', kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { id: 'whey', name: 'Proteína whey', kcal: 390, proteinG: 78, carbsG: 8, fatG: 6 },
  { id: 'berries', name: 'Frutos rojos', kcal: 50, proteinG: 1, carbsG: 12, fatG: 0.4 },
];

export const CORE_RECIPES: RecipeDefinition[] = [
  {
    id: 'oat-cake', name: 'Bizcocho de avena, huevo y claras', servings: 1, prepMinutes: 12,
    ingredients: [
      { ingredientId: 'oats', grams: 60 }, { ingredientId: 'egg', grams: 60 }, { ingredientId: 'eggwhite', grams: 150 }, { ingredientId: 'banana', grams: 80 },
    ],
    steps: ['Tritura o mezcla la avena con el huevo, las claras y el plátano.', 'Vierte la mezcla en un recipiente apto para microondas o airfryer.', 'Cocina hasta que el centro quede cuajado y deja reposar un minuto antes de comer.'],
  },
  {
    id: 'skyr-bowl', name: 'Skyr con avena y frutos rojos', servings: 1, prepMinutes: 4,
    ingredients: [
      { ingredientId: 'skyr', grams: 250 }, { ingredientId: 'oats', grams: 40 }, { ingredientId: 'berries', grams: 120 },
    ],
    steps: ['Sirve el skyr en un bol.', 'Añade la avena y mezcla.', 'Termina con los frutos rojos justo antes de comer.'],
  },
  {
    id: 'chicken-rice', name: 'Pollo con arroz y brócoli', servings: 1, prepMinutes: 22,
    ingredients: [
      { ingredientId: 'chicken', grams: 180 }, { ingredientId: 'rice', grams: 250 }, { ingredientId: 'broccoli', grams: 180 }, { ingredientId: 'oliveoil', grams: 10 },
    ],
    steps: ['Cocina la pechuga de pollo a la plancha hasta que quede completamente hecha.', 'Calienta o cuece el arroz y cocina el brócoli al vapor o salteado.', 'Sirve todo junto y añade el aceite de oliva al final.'],
  },
  {
    id: 'chicken-potato', name: 'Pollo con patata y brócoli', servings: 1, prepMinutes: 28,
    ingredients: [
      { ingredientId: 'chicken', grams: 180 }, { ingredientId: 'potato', grams: 320 }, { ingredientId: 'broccoli', grams: 180 }, { ingredientId: 'oliveoil', grams: 10 },
    ],
    steps: ['Cocina la patata al microondas, hervida o en airfryer.', 'Cocina la pechuga de pollo hasta que quede completamente hecha.', 'Añade el brócoli cocinado y termina con el aceite de oliva.'],
  },
  {
    id: 'tuna-toast', name: 'Tostadas integrales con atún y tomate', servings: 1, prepMinutes: 8,
    ingredients: [
      { ingredientId: 'bread', grams: 100 }, { ingredientId: 'tuna', grams: 120 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'oliveoil', grams: 8 },
    ],
    steps: ['Tuesta el pan al gusto.', 'Escurre el atún y repártelo sobre las tostadas.', 'Añade el tomate y el aceite de oliva justo antes de servir.'],
  },
  {
    id: 'whey-banana', name: 'Batido de whey y plátano', servings: 1, prepMinutes: 3,
    ingredients: [
      { ingredientId: 'whey', grams: 30 }, { ingredientId: 'banana', grams: 120 },
    ],
    steps: ['Añade agua fría al vaso mezclador o batidora.', 'Incorpora la proteína whey y el plátano.', 'Agita o bate hasta obtener una mezcla homogénea.'],
  },
];
