import type { IngredientDefinition, RecipeDefinition } from './recipePlanner';

// Generic food-composition references per 100 g. The physical state is explicit.
// For packaged foods, the label on the product takes precedence over these generic values.
export const CORE_INGREDIENTS: IngredientDefinition[] = [
  { id: 'oats', name: 'Avena seca', kcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9 },
  { id: 'egg', name: 'Huevo entero', kcal: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5 },
  { id: 'eggwhite', name: 'Claras de huevo', kcal: 52, proteinG: 10.9, carbsG: 0.7, fatG: 0.2 },
  { id: 'skyr', name: 'Skyr natural', kcal: 63, proteinG: 11, carbsG: 4, fatG: 0.2 },
  { id: 'greek0', name: 'Yogur griego 0%', kcal: 59, proteinG: 10.3, carbsG: 3.6, fatG: 0.4 },
  { id: 'cottage', name: 'Queso cottage', kcal: 98, proteinG: 11.1, carbsG: 3.4, fatG: 4.3 },
  { id: 'soy-yogurt', name: 'Yogur de soja natural', kcal: 54, proteinG: 4, carbsG: 3, fatG: 2.8 },
  { id: 'tofu', name: 'Tofu firme', kcal: 144, proteinG: 17.3, carbsG: 2.8, fatG: 8.7 },
  { id: 'tempeh', name: 'Tempeh', kcal: 193, proteinG: 20.3, carbsG: 7.6, fatG: 10.8 },
  { id: 'plant-protein', name: 'Proteína vegetal en polvo', kcal: 370, proteinG: 75, carbsG: 10, fatG: 6 },
  { id: 'banana', name: 'Plátano', kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3 },
  { id: 'apple', name: 'Manzana', kcal: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2 },
  { id: 'berries', name: 'Frutos rojos', kcal: 50, proteinG: 1, carbsG: 12, fatG: 0.4 },
  { id: 'chia', name: 'Semillas de chía', kcal: 486, proteinG: 16.5, carbsG: 42.1, fatG: 30.7 },
  { id: 'almonds', name: 'Almendras', kcal: 579, proteinG: 21.2, carbsG: 21.6, fatG: 49.9 },
  { id: 'peanutbutter', name: 'Crema de cacahuete 100%', kcal: 588, proteinG: 25, carbsG: 20, fatG: 50 },
  { id: 'chicken', name: 'Pechuga de pollo cocinada', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { id: 'turkey', name: 'Pechuga de pavo cocinada', kcal: 135, proteinG: 29, carbsG: 0, fatG: 1.8 },
  { id: 'salmon', name: 'Salmón cocinado', kcal: 208, proteinG: 20, carbsG: 0, fatG: 13 },
  { id: 'tuna', name: 'Atún al natural escurrido', kcal: 116, proteinG: 25.5, carbsG: 0, fatG: 0.8 },
  { id: 'rice', name: 'Arroz blanco cocido', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { id: 'rice-dry', name: 'Arroz blanco seco', kcal: 360, proteinG: 7, carbsG: 79, fatG: 0.7 },
  { id: 'potato', name: 'Patata cocida', kcal: 87, proteinG: 1.9, carbsG: 20.1, fatG: 0.1 },
  { id: 'pasta', name: 'Pasta integral cocida', kcal: 149, proteinG: 5.5, carbsG: 30.1, fatG: 1.4 },
  { id: 'lentils', name: 'Lentejas cocidas', kcal: 116, proteinG: 9, carbsG: 20.1, fatG: 0.4 },
  { id: 'chickpeas', name: 'Garbanzos cocidos', kcal: 164, proteinG: 8.9, carbsG: 27.4, fatG: 2.6 },
  { id: 'beans', name: 'Alubias cocidas', kcal: 127, proteinG: 8.7, carbsG: 22.8, fatG: 0.5 },
  { id: 'bread', name: 'Pan integral', kcal: 247, proteinG: 13, carbsG: 41, fatG: 4.2 },
  { id: 'wrap', name: 'Tortilla integral de trigo', kcal: 310, proteinG: 9, carbsG: 52, fatG: 7.5 },
  { id: 'broccoli', name: 'Brócoli cocido', kcal: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4 },
  { id: 'spinach', name: 'Espinaca', kcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4 },
  { id: 'tomato', name: 'Tomate', kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { id: 'pepper', name: 'Pimiento rojo', kcal: 31, proteinG: 1, carbsG: 6, fatG: 0.3 },
  { id: 'carrot', name: 'Zanahoria', kcal: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2 },
  { id: 'avocado', name: 'Aguacate', kcal: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7 },
  { id: 'oliveoil', name: 'Aceite de oliva virgen extra', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100 },
  { id: 'whey', name: 'Proteína whey', kcal: 390, proteinG: 78, carbsG: 8, fatG: 6 },
];

export const CORE_RECIPES: RecipeDefinition[] = [
  {
    id: 'oat-cake', name: 'Bizcocho de avena, huevo, claras y chía', servings: 1, prepMinutes: 12,
    ingredients: [{ ingredientId: 'oats', grams: 55 }, { ingredientId: 'egg', grams: 60 }, { ingredientId: 'eggwhite', grams: 150 }, { ingredientId: 'banana', grams: 80 }, { ingredientId: 'chia', grams: 10 }],
    steps: ['Mezcla o tritura todos los ingredientes.', 'Cocina en microondas o airfryer hasta que el centro quede cuajado.', 'Deja reposar un minuto.'],
  },
  {
    id: 'skyr-bowl', name: 'Skyr con avena, chía y frutos rojos', servings: 1, prepMinutes: 4,
    ingredients: [{ ingredientId: 'skyr', grams: 250 }, { ingredientId: 'oats', grams: 35 }, { ingredientId: 'berries', grams: 120 }, { ingredientId: 'chia', grams: 10 }],
    steps: ['Sirve el skyr.', 'Añade avena y chía.', 'Termina con los frutos rojos.'],
  },
  {
    id: 'greek-fruit', name: 'Yogur griego, fruta y almendras', servings: 1, prepMinutes: 3,
    ingredients: [{ ingredientId: 'greek0', grams: 250 }, { ingredientId: 'apple', grams: 160 }, { ingredientId: 'almonds', grams: 18 }],
    steps: ['Trocea la fruta.', 'Mézclala con el yogur.', 'Añade las almendras al servir.'],
  },
  {
    id: 'cottage-toast', name: 'Tostadas con cottage y tomate', servings: 1, prepMinutes: 7,
    ingredients: [{ ingredientId: 'bread', grams: 90 }, { ingredientId: 'cottage', grams: 180 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'oliveoil', grams: 5 }],
    steps: ['Tuesta el pan.', 'Reparte el cottage y el tomate.', 'Añade el aceite al final.'],
  },
  {
    id: 'vegan-oat-bowl', name: 'Avena con soja, chía, frutos rojos y proteína vegetal', servings: 1, prepMinutes: 5,
    ingredients: [{ ingredientId: 'soy-yogurt', grams: 250 }, { ingredientId: 'oats', grams: 45 }, { ingredientId: 'berries', grams: 120 }, { ingredientId: 'chia', grams: 10 }, { ingredientId: 'plant-protein', grams: 25 }],
    steps: ['Mezcla el yogur de soja con la avena.', 'Añade proteína vegetal y chía.', 'Termina con frutos rojos.'],
  },
  {
    id: 'plant-shake', name: 'Batido vegetal de plátano y proteína', servings: 1, prepMinutes: 3,
    ingredients: [{ ingredientId: 'plant-protein', grams: 30 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'oats', grams: 25 }],
    steps: ['Añade agua o bebida vegetal sin azúcar.', 'Incorpora los ingredientes.', 'Bate hasta que quede homogéneo.'],
  },
  {
    id: 'chicken-rice', name: 'Pollo con arroz y brócoli', servings: 1, prepMinutes: 22,
    ingredients: [{ ingredientId: 'chicken', grams: 170 }, { ingredientId: 'rice', grams: 240 }, { ingredientId: 'broccoli', grams: 180 }, { ingredientId: 'oliveoil', grams: 10 }],
    steps: ['Cocina completamente el pollo.', 'Sirve con arroz ya cocido y brócoli.', 'Añade el aceite de oliva al final.'],
  },
  {
    id: 'chicken-potato', name: 'Pollo con patata, pimiento y brócoli', servings: 1, prepMinutes: 28,
    ingredients: [{ ingredientId: 'chicken', grams: 170 }, { ingredientId: 'potato', grams: 320 }, { ingredientId: 'broccoli', grams: 140 }, { ingredientId: 'pepper', grams: 100 }, { ingredientId: 'oliveoil', grams: 10 }],
    steps: ['Cocina la patata.', 'Cocina completamente el pollo.', 'Añade verduras y aceite al final.'],
  },
  {
    id: 'turkey-pasta', name: 'Pavo con pasta integral y verduras', servings: 1, prepMinutes: 20,
    ingredients: [{ ingredientId: 'turkey', grams: 180 }, { ingredientId: 'pasta', grams: 230 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'tomato', grams: 140 }, { ingredientId: 'oliveoil', grams: 10 }],
    steps: ['Cocina el pavo completamente.', 'Mézclalo con la pasta cocida.', 'Añade espinaca, tomate y aceite.'],
  },
  {
    id: 'salmon-potato', name: 'Salmón con patata y ensalada', servings: 1, prepMinutes: 24,
    ingredients: [{ ingredientId: 'salmon', grams: 160 }, { ingredientId: 'potato', grams: 300 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'tomato', grams: 150 }],
    steps: ['Cocina el salmón.', 'Prepara la patata.', 'Sirve con espinaca y tomate.'],
  },
  {
    id: 'lentil-chicken', name: 'Lentejas con pollo y verduras', servings: 1, prepMinutes: 18,
    ingredients: [{ ingredientId: 'lentils', grams: 260 }, { ingredientId: 'chicken', grams: 120 }, { ingredientId: 'tomato', grams: 120 }, { ingredientId: 'pepper', grams: 100 }, { ingredientId: 'oliveoil', grams: 8 }],
    steps: ['Calienta las lentejas cocidas.', 'Añade pollo ya cocinado y verduras.', 'Termina con aceite de oliva.'],
  },
  {
    id: 'chickpea-tuna', name: 'Ensalada de garbanzos y atún', servings: 1, prepMinutes: 10,
    ingredients: [{ ingredientId: 'chickpeas', grams: 220 }, { ingredientId: 'tuna', grams: 120 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'spinach', grams: 80 }, { ingredientId: 'oliveoil', grams: 8 }],
    steps: ['Enjuaga y escurre los garbanzos.', 'Mezcla con atún y verduras.', 'Aliña con aceite.'],
  },
  {
    id: 'tuna-toast', name: 'Tostadas integrales con atún, aguacate y tomate', servings: 1, prepMinutes: 8,
    ingredients: [{ ingredientId: 'bread', grams: 90 }, { ingredientId: 'tuna', grams: 120 }, { ingredientId: 'avocado', grams: 55 }, { ingredientId: 'tomato', grams: 150 }],
    steps: ['Tuesta el pan.', 'Reparte el atún y aguacate.', 'Añade tomate.'],
  },
  {
    id: 'turkey-wrap', name: 'Wrap integral de pavo y aguacate', servings: 1, prepMinutes: 9,
    ingredients: [{ ingredientId: 'wrap', grams: 75 }, { ingredientId: 'turkey', grams: 130 }, { ingredientId: 'avocado', grams: 45 }, { ingredientId: 'tomato', grams: 100 }, { ingredientId: 'spinach', grams: 60 }],
    steps: ['Calienta ligeramente la tortilla.', 'Rellena con pavo, aguacate y verduras.', 'Enrolla y sirve.'],
  },
  {
    id: 'tofu-rice', name: 'Tofu con arroz y verduras', servings: 1, prepMinutes: 18,
    ingredients: [{ ingredientId: 'tofu', grams: 220 }, { ingredientId: 'rice', grams: 230 }, { ingredientId: 'broccoli', grams: 160 }, { ingredientId: 'pepper', grams: 100 }, { ingredientId: 'oliveoil', grams: 8 }],
    steps: ['Dora el tofu.', 'Añade las verduras.', 'Sirve con arroz cocido y aceite.'],
  },
  {
    id: 'tempeh-potato', name: 'Tempeh con patata y ensalada', servings: 1, prepMinutes: 20,
    ingredients: [{ ingredientId: 'tempeh', grams: 180 }, { ingredientId: 'potato', grams: 300 }, { ingredientId: 'spinach', grams: 100 }, { ingredientId: 'tomato', grams: 150 }, { ingredientId: 'oliveoil', grams: 5 }],
    steps: ['Dora el tempeh.', 'Prepara la patata.', 'Sirve con ensalada y aceite.'],
  },
  {
    id: 'lentil-tofu', name: 'Lentejas con tofu y verduras', servings: 1, prepMinutes: 16,
    ingredients: [{ ingredientId: 'lentils', grams: 240 }, { ingredientId: 'tofu', grams: 160 }, { ingredientId: 'tomato', grams: 130 }, { ingredientId: 'carrot', grams: 100 }, { ingredientId: 'oliveoil', grams: 6 }],
    steps: ['Calienta las lentejas.', 'Dora el tofu.', 'Combina con verduras y aceite.'],
  },
  {
    id: 'bean-tempeh-bowl', name: 'Bowl de alubias, tempeh y arroz', servings: 1, prepMinutes: 18,
    ingredients: [{ ingredientId: 'beans', grams: 200 }, { ingredientId: 'tempeh', grams: 130 }, { ingredientId: 'rice', grams: 180 }, { ingredientId: 'tomato', grams: 120 }, { ingredientId: 'spinach', grams: 70 }],
    steps: ['Calienta alubias y arroz.', 'Dora el tempeh.', 'Sirve con tomate y espinaca.'],
  },
  {
    id: 'whey-banana', name: 'Batido de whey y plátano', servings: 1, prepMinutes: 3,
    ingredients: [{ ingredientId: 'whey', grams: 30 }, { ingredientId: 'banana', grams: 120 }],
    steps: ['Añade agua fría.', 'Incorpora whey y plátano.', 'Bate hasta obtener una mezcla homogénea.'],
  },
  {
    id: 'skyr-banana', name: 'Skyr con plátano y almendras', servings: 1, prepMinutes: 3,
    ingredients: [{ ingredientId: 'skyr', grams: 250 }, { ingredientId: 'banana', grams: 120 }, { ingredientId: 'almonds', grams: 15 }],
    steps: ['Sirve el skyr.', 'Añade plátano.', 'Termina con almendras troceadas.'],
  },
];
