export interface DetailedNutrition {
  kcal: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarsG: number | null;
  saturatedFatG: number | null;
  sodiumMg: number | null;
}

export interface DetailedPlanMeal {
  slot: string;
  name: string;
  ingredients: string;
  nutrition: DetailedNutrition;
}

export interface DetailedPlanDay {
  day: number;
  meals: DetailedPlanMeal[];
}

export const DETAILED_30_DAY_PLAN: DetailedPlanDay[] = [
  { day: 1, meals: [
    {
      slot: "05:00 - Bizcocho preentreno",
      name: "Bizcocho base",
      ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano",
      nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 },
    },
    {
      slot: "Postentreno - Batido",
      name: "Batido de proteína",
      ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.",
      nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null },
    },
    {
      slot: "Comida",
      name: "Pollo teriyaki con arroz",
      ingredients: "150 g pollo; 105 g arroz seco; 250 g verduras; 10 g AOVE; 25 g salsa teriyaki",
      nutrition: { kcal: 756, proteinG: 46.9, carbsG: 102.5, fatG: 15.7, fiberG: 7.7, sugarsG: 11.6, saturatedFatG: 2.9, sodiumMg: 785 },
    },
    {
      slot: "Merienda - M1",
      name: "Skyr, avena, frutos rojos, chia y miel",
      ingredients: "200 g skyr/yogur alto proteína; 35 g avena; 100 g frutos rojos; 10 g chía; 10 g miel",
      nutrition: { kcal: 391, proteinG: 30.6, carbsG: 55.7, fatG: 6.4, fiberG: 12.2, sugarsG: 23.5, saturatedFatG: 0.9, sodiumMg: 84 },
    },
    {
      slot: "Cena",
      name: "Salmón con patata",
      ingredients: "150 g salmón; 350 g patata; 250 g verduras; 5 g AOVE; 50 g pan",
      nutrition: { kcal: 838, proteinG: 46.2, carbsG: 99, fatG: 27.1, fiberG: 15.7, sugarsG: 13.3, saturatedFatG: 5.9, sodiumMg: 442 },
    },
  ] },
  { day: 2, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pasta cremosa de pollo", ingredients: "150 g pollo; 110 g pasta seca; 200 g champiñones; 100 g tomate; 40 g queso crema ligero; 10 g AOVE; 10 g parmesano", nutrition: { kcal: 822, proteinG: 62.1, carbsG: 90.7, fatG: 24.8, fiberG: 12, sugarsG: 11.6, saturatedFatG: 7.7, sodiumMg: 422 } },
    { slot: "Merienda - M2", name: "Yogur alto en proteína, plátano, avena y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 100 g plátano; 25 g avena; 15 g crema cacahuete", nutrition: { kcal: 400, proteinG: 31.1, carbsG: 50.4, fatG: 9.9, fiberG: 6.2, sugarsG: 21.8, saturatedFatG: 2.1, sodiumMg: 84 } },
    { slot: "Cena", name: "Tortilla española ligera", ingredients: "100 g huevo; 150 g claras; 350 g patata; 100 g cebolla; 10 g AOVE; 60 g pan; 150 g verduras", nutrition: { kcal: 821, proteinG: 45.2, carbsG: 108.9, fatG: 22.4, fiberG: 15.2, sugarsG: 16.2, saturatedFatG: 5, sodiumMg: 762 } },
  ] },
  { day: 3, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Burrito bowl", ingredients: "150 g pollo; 90 g arroz seco; 100 g frijoles cocidos; 100 g maíz; 200 g verduras; 50 g aguacate", nutrition: { kcal: 877, proteinG: 57.1, carbsG: 131.1, fatG: 14.7, fiberG: 18.3, sugarsG: 11.6, saturatedFatG: 2.8, sodiumMg: 148 } },
    { slot: "Merienda - M3", name: "Skyr, avena, fresas, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 40 g avena; 100 g fresas; 10 g chía; 10 g miel", nutrition: { kcal: 393, proteinG: 31.1, carbsG: 54.7, fatG: 6.5, fiberG: 9.7, sugarsG: 21.5, saturatedFatG: 1, sodiumMg: 84 } },
    { slot: "Cena", name: "Pasta mediterránea de atún", ingredients: "100 g pasta seca; 120 g atún escurrido; 150 g tomate; 200 g verduras; 15 g AOVE; 15 g parmesano", nutrition: { kcal: 783, proteinG: 54.7, carbsG: 88.5, fatG: 23.9, fiberG: 14.8, sugarsG: 13.4, saturatedFatG: 5.8, sodiumMg: 673 } },
  ] },
  { day: 4, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Curry de pollo", ingredients: "150 g pollo; 105 g arroz seco; 250 g verduras; 80 g leche coco ligera; 5 g AOVE", nutrition: { kcal: 750, proteinG: 46.7, carbsG: 100.2, fatG: 16.1, fiberG: 7.6, sugarsG: 9.5, saturatedFatG: 7, sodiumMg: 176 } },
    { slot: "Merienda - M4", name: "Yogur alto en proteína, mango, avena, chia y almendras", ingredients: "200 g skyr/yogur alto proteína; 120 g mango; 30 g avena; 10 g chía; 10 g almendras", nutrition: { kcal: 421, proteinG: 31.8, carbsG: 52.3, fatG: 11, fiberG: 9.8, sugarsG: 25.2, saturatedFatG: 1.4, sodiumMg: 83 } },
    { slot: "Cena", name: "Salmón teriyaki", ingredients: "150 g salmón; 85 g arroz seco; 250 g verduras; 20 g salsa teriyaki; 5 g AOVE", nutrition: { kcal: 768, proteinG: 41.6, carbsG: 85.8, fatG: 26.1, fiberG: 7.5, sugarsG: 10.9, saturatedFatG: 5.8, sodiumMg: 680 } },
  ] },
  { day: 5, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo mediterráneo", ingredients: "160 g pollo; 100 g cuscús seco; 250 g verduras; 15 g AOVE", nutrition: { kcal: 788, proteinG: 53.8, carbsG: 92.4, fatG: 20.8, fiberG: 11.2, sugarsG: 8.2, saturatedFatG: 3.6, sodiumMg: 170 } },
    { slot: "Merienda - M5", name: "Skyr, avena, plátano, cacao y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 30 g avena; 100 g plátano; 8 g cacao desgrasado; 10 g crema cacahuete", nutrition: { kcal: 409, proteinG: 32.2, carbsG: 57.3, fatG: 8.9, fiberG: 9.3, sugarsG: 21.5, saturatedFatG: 2.3, sodiumMg: 85 } },
    { slot: "Cena", name: "Fajitas de pollo", ingredients: "150 g pollo; 120 g tortillas; 250 g verduras; 50 g aguacate; 50 g yogur; 5 g AOVE", nutrition: { kcal: 796, proteinG: 54.7, carbsG: 83.7, fatG: 27.5, fiberG: 14.6, sugarsG: 12.8, saturatedFatG: 5.6, sodiumMg: 961 } },
  ] },
  { day: 6, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo tikka masala ligero", ingredients: "150 g pollo; 100 g arroz seco; 200 g tomate; 100 g yogur; 200 g verduras; 10 g AOVE", nutrition: { kcal: 802, proteinG: 57.6, carbsG: 102.5, fatG: 17, fiberG: 9.3, sugarsG: 16.3, saturatedFatG: 3.2, sodiumMg: 245 } },
    { slot: "Merienda - M6", name: "Yogur alto en proteína, chia, avena y plátano", ingredients: "200 g skyr/yogur alto proteína; 15 g chía; 30 g avena; 100 g plátano", nutrition: { kcal: 405, proteinG: 30.6, carbsG: 57, fatG: 7.4, fiberG: 10.9, sugarsG: 20.5, saturatedFatG: 1.2, sodiumMg: 84 } },
    { slot: "Cena", name: "Hamburguesa de pollo casera", ingredients: "180 g pollo; 75 g pan hamburguesa; 250 g patata; 200 g verduras; 20 g queso ligero; 10 g AOVE", nutrition: { kcal: 885, proteinG: 67.7, carbsG: 97.8, fatG: 24.9, fiberG: 11.9, sugarsG: 11.8, saturatedFatG: 6.2, sodiumMg: 697 } },
  ] },
  { day: 7, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo al limón con arroz", ingredients: "150 g pollo; 105 g arroz seco; 250 g verduras; 10 g AOVE; 15 g miel; limón", nutrition: { kcal: 774, proteinG: 46.4, carbsG: 108.8, fatG: 15.1, fiberG: 7.6, sugarsG: 16.5, saturatedFatG: 2.7, sodiumMg: 156 } },
    { slot: "Merienda - M1", name: "Skyr, avena, frutos rojos, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 35 g avena; 100 g frutos rojos; 10 g chía; 10 g miel", nutrition: { kcal: 391, proteinG: 30.6, carbsG: 55.7, fatG: 6.4, fiberG: 12.2, sugarsG: 23.5, saturatedFatG: 0.9, sodiumMg: 84 } },
    { slot: "Cena", name: "Ensalada templada de pollo y patata", ingredients: "150 g pollo; 350 g patata; 300 g verduras; 60 g pan; 15 g AOVE", nutrition: { kcal: 847, proteinG: 53.8, carbsG: 102.5, fatG: 22.3, fiberG: 17, sugarsG: 13.9, saturatedFatG: 3.8, sodiumMg: 394 } },
  ] },
  { day: 8, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz estilo paella", ingredients: "160 g pollo; 105 g arroz seco; 300 g verduras; 10 g AOVE", nutrition: { kcal: 769, proteinG: 50.1, carbsG: 102.1, fatG: 15.7, fiberG: 9.6, sugarsG: 9, saturatedFatG: 2.9, sodiumMg: 181 } },
    { slot: "Merienda - M2", name: "Yogur alto en proteína, plátano, avena y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 100 g plátano; 25 g avena; 15 g crema cacahuete", nutrition: { kcal: 400, proteinG: 31.1, carbsG: 50.4, fatG: 9.9, fiberG: 6.2, sugarsG: 21.8, saturatedFatG: 2.1, sodiumMg: 84 } },
    { slot: "Cena", name: "Salmón al horno con cuscús", ingredients: "150 g salmón; 90 g cuscús seco; 250 g verduras; 5 g AOVE", nutrition: { kcal: 796, proteinG: 45.7, carbsG: 83.6, fatG: 27.4, fiberG: 9.7, sugarsG: 8.2, saturatedFatG: 5.9, sodiumMg: 156 } },
  ] },
  { day: 9, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pasta boloñesa de pollo", ingredients: "160 g pollo picado; 110 g pasta seca; 200 g tomate; 150 g verduras; 10 g AOVE; 15 g parmesano", nutrition: { kcal: 859, proteinG: 65.6, carbsG: 95.6, fatG: 24.2, fiberG: 13.7, sugarsG: 13.9, saturatedFatG: 6.4, sodiumMg: 389 } },
    { slot: "Merienda - M3", name: "Skyr, avena, fresas, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 40 g avena; 100 g fresas; 10 g chía; 10 g miel", nutrition: { kcal: 393, proteinG: 31.1, carbsG: 54.7, fatG: 6.5, fiberG: 9.7, sugarsG: 21.5, saturatedFatG: 1, sodiumMg: 84 } },
    { slot: "Cena", name: "Tacos de atún", ingredients: "120 g atún; 120 g tortillas; 200 g verduras; 70 g aguacate; 100 g maíz; 50 g yogur", nutrition: { kcal: 791, proteinG: 49.8, carbsG: 95.9, fatG: 26.5, fiberG: 16.6, sugarsG: 13, saturatedFatG: 4.7, sodiumMg: 1008 } },
  ] },
  { day: 10, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo al curry rojo", ingredients: "150 g pollo; 100 g arroz seco; 250 g verduras; 100 g leche coco ligera; 5 g AOVE", nutrition: { kcal: 751, proteinG: 46.2, carbsG: 96, fatG: 18.2, fiberG: 7.6, sugarsG: 9.7, saturatedFatG: 8.6, sodiumMg: 185 } },
    { slot: "Merienda - M4", name: "Yogur alto en proteína, mango, avena, chia y almendras", ingredients: "200 g skyr/yogur alto proteína; 120 g mango; 30 g avena; 10 g chía; 10 g almendras", nutrition: { kcal: 421, proteinG: 31.8, carbsG: 52.3, fatG: 11, fiberG: 9.8, sugarsG: 25.2, saturatedFatG: 1.4, sodiumMg: 83 } },
    { slot: "Cena", name: "Pollo con patata y verduras", ingredients: "160 g pollo; 400 g patata; 300 g verduras; 10 g AOVE", nutrition: { kcal: 778, proteinG: 55.2, carbsG: 92.8, fatG: 15.8, fiberG: 17.2, sugarsG: 14, saturatedFatG: 2.9, sodiumMg: 226 } },
  ] },
  { day: 11, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Arroz chaufa de pollo", ingredients: "150 g pollo; 100 g arroz seco; 100 g huevo; 250 g verduras; 10 g AOVE; 15 g salsa soja", nutrition: { kcal: 877, proteinG: 61.2, carbsG: 97.8, fatG: 25.9, fiberG: 7.6, sugarsG: 9.5, saturatedFatG: 5.4, sodiumMg: 1222 } },
    { slot: "Merienda - M5", name: "Skyr, avena, plátano, cacao y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 30 g avena; 100 g plátano; 8 g cacao desgrasado; 10 g crema cacahuete", nutrition: { kcal: 409, proteinG: 32.2, carbsG: 57.3, fatG: 8.9, fiberG: 9.3, sugarsG: 21.5, saturatedFatG: 2.3, sodiumMg: 85 } },
    { slot: "Cena", name: "Salmón con arroz y verduras", ingredients: "150 g salmón; 90 g arroz seco; 300 g verduras; 5 g AOVE", nutrition: { kcal: 772, proteinG: 40.5, carbsG: 89.1, fatG: 25.8, fiberG: 9.6, sugarsG: 9, saturatedFatG: 5.7, sodiumMg: 171 } },
  ] },
  { day: 12, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo pesto con pasta", ingredients: "150 g pollo; 105 g pasta seca; 250 g verduras; 20 g pesto; 10 g parmesano", nutrition: { kcal: 835, proteinG: 61.7, carbsG: 89.7, fatG: 24.1, fiberG: 13.7, sugarsG: 10.9, saturatedFatG: 6.2, sodiumMg: 477 } },
    { slot: "Merienda - M6", name: "Yogur alto en proteína, chia, avena y plátano", ingredients: "200 g skyr/yogur alto proteína; 15 g chía; 30 g avena; 100 g plátano", nutrition: { kcal: 405, proteinG: 30.6, carbsG: 57, fatG: 7.4, fiberG: 10.9, sugarsG: 20.5, saturatedFatG: 1.2, sodiumMg: 84 } },
    { slot: "Cena", name: "Tortilla francesa con patata", ingredients: "150 g huevo; 150 g claras; 350 g patata; 250 g verduras; 60 g pan; 10 g AOVE", nutrition: { kcal: 882, proteinG: 51.2, carbsG: 108, fatG: 27.8, fiberG: 16.9, sugarsG: 14.2, saturatedFatG: 6.5, sodiumMg: 849 } },
  ] },
  { day: 13, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con cuscús y verduras", ingredients: "160 g pollo; 100 g cuscús seco; 300 g verduras; 10 g AOVE", nutrition: { kcal: 772, proteinG: 54.3, carbsG: 94.7, fatG: 15.9, fiberG: 13.2, sugarsG: 9.8, saturatedFatG: 2.9, sodiumMg: 181 } },
    { slot: "Merienda - M1", name: "Skyr, avena, frutos rojos, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 35 g avena; 100 g frutos rojos; 10 g chía; 10 g miel", nutrition: { kcal: 391, proteinG: 30.6, carbsG: 55.7, fatG: 6.4, fiberG: 12.2, sugarsG: 23.5, saturatedFatG: 0.9, sodiumMg: 84 } },
    { slot: "Cena", name: "Ensalada de atún, patata y huevo", ingredients: "120 g atún; 350 g patata; 100 g huevo; 300 g verduras; 15 g AOVE", nutrition: { kcal: 805, proteinG: 53.4, carbsG: 82.1, fatG: 27.6, fiberG: 16.9, sugarsG: 13.7, saturatedFatG: 5.1, sodiumMg: 639 } },
  ] },
  { day: 14, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz y verduras al wok", ingredients: "150 g pollo; 105 g arroz seco; 300 g verduras; 10 g AOVE; 15 g salsa soja", nutrition: { kcal: 785, proteinG: 48.5, carbsG: 103.8, fatG: 15.2, fiberG: 9.6, sugarsG: 9.3, saturatedFatG: 2.7, sodiumMg: 1035 } },
    { slot: "Merienda - M2", name: "Yogur alto en proteína, plátano, avena y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 100 g plátano; 25 g avena; 15 g crema cacahuete", nutrition: { kcal: 400, proteinG: 31.1, carbsG: 50.4, fatG: 9.9, fiberG: 6.2, sugarsG: 21.8, saturatedFatG: 2.1, sodiumMg: 84 } },
    { slot: "Cena", name: "Pizza tortilla de pollo", ingredients: "120 g tortillas; 150 g pollo; 100 g tomate; 80 g mozzarella ligera; 200 g verduras", nutrition: { kcal: 801, proteinG: 67.1, carbsG: 77.6, fatG: 24.3, fiberG: 11.6, sugarsG: 11.9, saturatedFatG: 9.5, sodiumMg: 1365 } },
  ] },
  { day: 15, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo satay con arroz", ingredients: "150 g pollo; 100 g arroz seco; 250 g verduras; 20 g crema cacahuete; 5 g AOVE; 15 g salsa soja", nutrition: { kcal: 812, proteinG: 52.8, carbsG: 100, fatG: 21.8, fiberG: 9, sugarsG: 11.8, saturatedFatG: 3.8, sodiumMg: 1071 } },
    { slot: "Merienda - M3", name: "Skyr, avena, fresas, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 40 g avena; 100 g fresas; 10 g chía; 10 g miel", nutrition: { kcal: 393, proteinG: 31.1, carbsG: 54.7, fatG: 6.5, fiberG: 9.7, sugarsG: 21.5, saturatedFatG: 1, sodiumMg: 84 } },
    { slot: "Cena", name: "Salmón con pasta y espinacas", ingredients: "150 g salmón; 95 g pasta seca; 150 g espinacas; 150 g tomate; 5 g AOVE", nutrition: { kcal: 760, proteinG: 47.7, carbsG: 79.4, fatG: 26.2, fiberG: 12.5, sugarsG: 10.4, saturatedFatG: 5.7, sodiumMg: 224 } },
  ] },
  { day: 16, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo al ajillo con patata", ingredients: "160 g pollo; 400 g patata; 300 g verduras; 15 g AOVE", nutrition: { kcal: 822, proteinG: 55.2, carbsG: 92.8, fatG: 20.8, fiberG: 17.2, sugarsG: 14, saturatedFatG: 3.6, sodiumMg: 226 } },
    { slot: "Merienda - M4", name: "Yogur alto en proteína, mango, avena, chia y almendras", ingredients: "200 g skyr/yogur alto proteína; 120 g mango; 30 g avena; 10 g chía; 10 g almendras", nutrition: { kcal: 421, proteinG: 31.8, carbsG: 52.3, fatG: 11, fiberG: 9.8, sugarsG: 25.2, saturatedFatG: 1.4, sodiumMg: 83 } },
    { slot: "Cena", name: "Burrito de pollo", ingredients: "150 g pollo; 120 g tortillas; 80 g arroz seco; 100 g frijoles; 200 g verduras; 50 g aguacate", nutrition: { kcal: 1028, proteinG: 59.4, carbsG: 143.3, fatG: 23.6, fiberG: 19.8, sugarsG: 12.8, saturatedFatG: 4.5, sodiumMg: 1025 } },
  ] },
  { day: 17, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con quinoa", ingredients: "160 g pollo; 110 g quinoa seca; 300 g verduras; 10 g AOVE", nutrition: { kcal: 840, proteinG: 60.4, carbsG: 78.1, fatG: 25, fiberG: 17.7, sugarsG: 9.4, saturatedFatG: 3.4, sodiumMg: 197 } },
    { slot: "Merienda - M5", name: "Skyr, avena, plátano, cacao y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 30 g avena; 100 g plátano; 8 g cacao desgrasado; 10 g crema cacahuete", nutrition: { kcal: 409, proteinG: 32.2, carbsG: 57.3, fatG: 8.9, fiberG: 9.3, sugarsG: 21.5, saturatedFatG: 2.3, sodiumMg: 85 } },
    { slot: "Cena", name: "Salmón con boniato", ingredients: "150 g salmón; 350 g boniato; 300 g verduras; 5 g AOVE", nutrition: { kcal: 788, proteinG: 40.9, carbsG: 80.9, fatG: 26.2, fiberG: 16.5, sugarsG: 22.8, saturatedFatG: 5.8, sodiumMg: 306 } },
  ] },
  { day: 18, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pasta con pollo y espinacas", ingredients: "150 g pollo; 110 g pasta seca; 150 g espinacas; 150 g tomate; 10 g AOVE; 15 g parmesano", nutrition: { kcal: 849, proteinG: 66.2, carbsG: 94.3, fatG: 22.4, fiberG: 13.7, sugarsG: 11.8, saturatedFatG: 5.5, sodiumMg: 454 } },
    { slot: "Merienda - M6", name: "Yogur alto en proteína, chia, avena y plátano", ingredients: "200 g skyr/yogur alto proteína; 15 g chía; 30 g avena; 100 g plátano", nutrition: { kcal: 405, proteinG: 30.6, carbsG: 57, fatG: 7.4, fiberG: 10.9, sugarsG: 20.5, saturatedFatG: 1.2, sodiumMg: 84 } },
    { slot: "Cena", name: "Tacos de pollo", ingredients: "150 g pollo; 120 g tortillas; 300 g verduras; 70 g aguacate; 50 g yogur", nutrition: { kcal: 809, proteinG: 55.7, carbsG: 80.1, fatG: 28.5, fiberG: 14.6, sugarsG: 13.2, saturatedFatG: 5.7, sodiumMg: 971 } },
  ] },
  { day: 19, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz al curry", ingredients: "150 g pollo; 105 g arroz seco; 300 g verduras; 10 g AOVE; curry", nutrition: { kcal: 765, proteinG: 48.1, carbsG: 102.1, fatG: 15.3, fiberG: 9.6, sugarsG: 9, saturatedFatG: 2.8, sodiumMg: 170 } },
    { slot: "Merienda - M1", name: "Skyr, avena, frutos rojos, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 35 g avena; 100 g frutos rojos; 10 g chía; 10 g miel", nutrition: { kcal: 391, proteinG: 30.6, carbsG: 55.7, fatG: 6.4, fiberG: 12.2, sugarsG: 23.5, saturatedFatG: 0.9, sodiumMg: 84 } },
    { slot: "Cena", name: "Pasta de atún y tomate", ingredients: "100 g pasta seca; 120 g atún; 250 g tomate; 150 g verduras; 15 g AOVE; 10 g parmesano", nutrition: { kcal: 775, proteinG: 53.1, carbsG: 87.8, fatG: 23.1, fiberG: 14.3, sugarsG: 15.9, saturatedFatG: 5.1, sodiumMg: 616 } },
  ] },
  { day: 20, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con patata estilo bravas", ingredients: "160 g pollo; 450 g patata; 300 g verduras; 15 g AOVE; 50 g yogur; especias", nutrition: { kcal: 901, proteinG: 60.5, carbsG: 103.5, fatG: 21.8, fiberG: 18.2, sugarsG: 15.8, saturatedFatG: 4.4, sodiumMg: 280 } },
    { slot: "Merienda - M2", name: "Yogur alto en proteína, plátano, avena y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 100 g plátano; 25 g avena; 15 g crema cacahuete", nutrition: { kcal: 400, proteinG: 31.1, carbsG: 50.4, fatG: 9.9, fiberG: 6.2, sugarsG: 21.8, saturatedFatG: 2.1, sodiumMg: 84 } },
    { slot: "Cena", name: "Salmón con arroz", ingredients: "150 g salmón; 90 g arroz seco; 300 g verduras; 5 g AOVE", nutrition: { kcal: 772, proteinG: 40.5, carbsG: 89.1, fatG: 25.8, fiberG: 9.6, sugarsG: 9, saturatedFatG: 5.7, sodiumMg: 171 } },
  ] },
  { day: 21, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo tex-mex", ingredients: "150 g pollo; 90 g arroz seco; 100 g frijoles; 100 g maíz; 250 g verduras; 50 g aguacate; 5 g AOVE", nutrition: { kcal: 942, proteinG: 58.1, carbsG: 134.1, fatG: 19.7, fiberG: 20.3, sugarsG: 13.1, saturatedFatG: 3.5, sodiumMg: 167 } },
    { slot: "Merienda - M3", name: "Skyr, avena, fresas, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 40 g avena; 100 g fresas; 10 g chía; 10 g miel", nutrition: { kcal: 393, proteinG: 31.1, carbsG: 54.7, fatG: 6.5, fiberG: 9.7, sugarsG: 21.5, saturatedFatG: 1, sodiumMg: 84 } },
    { slot: "Cena", name: "Ensalada César de pollo ligera", ingredients: "160 g pollo; 300 g verduras; 80 g pan; 20 g parmesano; 80 g yogur; 10 g AOVE", nutrition: { kcal: 765, proteinG: 65.8, carbsG: 58.5, fatG: 29.1, fiberG: 11.4, sugarsG: 14, saturatedFatG: 7.4, sodiumMg: 746 } },
  ] },
  { day: 22, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con pasta al pesto rojo", ingredients: "150 g pollo; 105 g pasta seca; 250 g verduras; 20 g pesto rojo; 10 g parmesano", nutrition: { kcal: 835, proteinG: 61.7, carbsG: 89.7, fatG: 24.1, fiberG: 13.7, sugarsG: 10.9, saturatedFatG: 6.2, sodiumMg: 477 } },
    { slot: "Merienda - M4", name: "Yogur alto en proteína, mango, avena, chia y almendras", ingredients: "200 g skyr/yogur alto proteína; 120 g mango; 30 g avena; 10 g chía; 10 g almendras", nutrition: { kcal: 421, proteinG: 31.8, carbsG: 52.3, fatG: 11, fiberG: 9.8, sugarsG: 25.2, saturatedFatG: 1.4, sodiumMg: 83 } },
    { slot: "Cena", name: "Salmón con patata", ingredients: "150 g salmón; 350 g patata; 250 g verduras; 5 g AOVE; 50 g pan", nutrition: { kcal: 838, proteinG: 46.2, carbsG: 99, fatG: 27.1, fiberG: 15.7, sugarsG: 13.3, saturatedFatG: 5.9, sodiumMg: 442 } },
  ] },
  { day: 23, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo oriental con noodles", ingredients: "150 g pollo; 110 g noodles secos; 300 g verduras; 10 g AOVE; 15 g salsa soja", nutrition: { kcal: 801, proteinG: 53.1, carbsG: 101.1, fatG: 15.7, fiberG: 10.8, sugarsG: 10.4, saturatedFatG: 2.8, sodiumMg: 1102 } },
    { slot: "Merienda - M5", name: "Skyr, avena, plátano, cacao y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 30 g avena; 100 g plátano; 8 g cacao desgrasado; 10 g crema cacahuete", nutrition: { kcal: 409, proteinG: 32.2, carbsG: 57.3, fatG: 8.9, fiberG: 9.3, sugarsG: 21.5, saturatedFatG: 2.3, sodiumMg: 85 } },
    { slot: "Cena", name: "Tortilla española ligera", ingredients: "100 g huevo; 150 g claras; 350 g patata; 100 g cebolla; 10 g AOVE; 60 g pan; 150 g verduras", nutrition: { kcal: 821, proteinG: 45.2, carbsG: 108.9, fatG: 22.4, fiberG: 15.2, sugarsG: 16.2, saturatedFatG: 5, sodiumMg: 762 } },
  ] },
  { day: 24, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz y piña", ingredients: "150 g pollo; 100 g arroz seco; 150 g piña; 250 g verduras; 10 g AOVE; 15 g salsa soja", nutrition: { kcal: 847, proteinG: 48.4, carbsG: 120.7, fatG: 15.3, fiberG: 10.1, sugarsG: 28.7, saturatedFatG: 2.8, sodiumMg: 1032 } },
    { slot: "Merienda - M6", name: "Yogur alto en proteína, chia, avena y plátano", ingredients: "200 g skyr/yogur alto proteína; 15 g chía; 30 g avena; 100 g plátano", nutrition: { kcal: 405, proteinG: 30.6, carbsG: 57, fatG: 7.4, fiberG: 10.9, sugarsG: 20.5, saturatedFatG: 1.2, sodiumMg: 84 } },
    { slot: "Cena", name: "Salmón con cuscús", ingredients: "150 g salmón; 90 g cuscús seco; 250 g verduras; 5 g AOVE", nutrition: { kcal: 796, proteinG: 45.7, carbsG: 83.6, fatG: 27.4, fiberG: 9.7, sugarsG: 8.2, saturatedFatG: 5.9, sodiumMg: 156 } },
  ] },
  { day: 25, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con quinoa y aguacate", ingredients: "160 g pollo; 100 g quinoa seca; 300 g verduras; 70 g aguacate; 5 g AOVE", nutrition: { kcal: 873, proteinG: 59.6, carbsG: 74.6, fatG: 30.8, fiberG: 20.6, sugarsG: 10.1, saturatedFatG: 4.3, sodiumMg: 203 } },
    { slot: "Merienda - M1", name: "Skyr, avena, frutos rojos, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 35 g avena; 100 g frutos rojos; 10 g chía; 10 g miel", nutrition: { kcal: 391, proteinG: 30.6, carbsG: 55.7, fatG: 6.4, fiberG: 12.2, sugarsG: 23.5, saturatedFatG: 0.9, sodiumMg: 84 } },
    { slot: "Cena", name: "Pasta de pollo y tomate", ingredients: "150 g pollo; 100 g pasta seca; 250 g tomate; 150 g verduras; 10 g AOVE; 10 g parmesano", nutrition: { kcal: 798, proteinG: 61.5, carbsG: 87.8, fatG: 18.7, fiberG: 14.3, sugarsG: 15.9, saturatedFatG: 4.3, sodiumMg: 318 } },
  ] },
  { day: 26, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo al horno con boniato", ingredients: "160 g pollo; 400 g boniato; 300 g verduras; 15 g AOVE", nutrition: { kcal: 837, proteinG: 55.2, carbsG: 93.8, fatG: 20.7, fiberG: 18, sugarsG: 25, saturatedFatG: 3.6, sodiumMg: 351 } },
    { slot: "Merienda - M2", name: "Yogur alto en proteína, plátano, avena y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 100 g plátano; 25 g avena; 15 g crema cacahuete", nutrition: { kcal: 400, proteinG: 31.1, carbsG: 50.4, fatG: 9.9, fiberG: 6.2, sugarsG: 21.8, saturatedFatG: 2.1, sodiumMg: 84 } },
    { slot: "Cena", name: "Salmón con arroz y verduras", ingredients: "150 g salmón; 90 g arroz seco; 300 g verduras; 5 g AOVE", nutrition: { kcal: 772, proteinG: 40.5, carbsG: 89.1, fatG: 25.8, fiberG: 9.6, sugarsG: 9, saturatedFatG: 5.7, sodiumMg: 171 } },
  ] },
  { day: 27, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz y huevo", ingredients: "150 g pollo; 100 g arroz seco; 100 g huevo; 300 g verduras; 10 g AOVE", nutrition: { kcal: 864, proteinG: 60.7, carbsG: 96.3, fatG: 25.3, fiberG: 9.6, sugarsG: 9.3, saturatedFatG: 5.3, sodiumMg: 356 } },
    { slot: "Merienda - M3", name: "Skyr, avena, fresas, chia y miel", ingredients: "200 g skyr/yogur alto proteína; 40 g avena; 100 g fresas; 10 g chía; 10 g miel", nutrition: { kcal: 393, proteinG: 31.1, carbsG: 54.7, fatG: 6.5, fiberG: 9.7, sugarsG: 21.5, saturatedFatG: 1, sodiumMg: 84 } },
    { slot: "Cena", name: "Tacos de pollo", ingredients: "150 g pollo; 120 g tortillas; 300 g verduras; 70 g aguacate; 50 g yogur", nutrition: { kcal: 809, proteinG: 55.7, carbsG: 80.1, fatG: 28.5, fiberG: 14.6, sugarsG: 13.2, saturatedFatG: 5.7, sodiumMg: 971 } },
  ] },
  { day: 28, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con pasta y verduras", ingredients: "160 g pollo; 110 g pasta seca; 300 g verduras; 10 g AOVE; 10 g parmesano", nutrition: { kcal: 851, proteinG: 65.7, carbsG: 95.5, fatG: 20.9, fiberG: 15.2, sugarsG: 11.9, saturatedFatG: 4.7, sodiumMg: 331 } },
    { slot: "Merienda - M4", name: "Yogur alto en proteína, mango, avena, chia y almendras", ingredients: "200 g skyr/yogur alto proteína; 120 g mango; 30 g avena; 10 g chía; 10 g almendras", nutrition: { kcal: 421, proteinG: 31.8, carbsG: 52.3, fatG: 11, fiberG: 9.8, sugarsG: 25.2, saturatedFatG: 1.4, sodiumMg: 83 } },
    { slot: "Cena", name: "Salmón con patata y verduras", ingredients: "150 g salmón; 350 g patata; 300 g verduras; 5 g AOVE", nutrition: { kcal: 757, proteinG: 42.4, carbsG: 84, fatG: 25.5, fiberG: 16.5, sugarsG: 14, saturatedFatG: 5.7, sodiumMg: 186 } },
  ] },
  { day: 29, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo con arroz y curry", ingredients: "150 g pollo; 105 g arroz seco; 300 g verduras; 10 g AOVE; curry", nutrition: { kcal: 765, proteinG: 48.1, carbsG: 102.1, fatG: 15.3, fiberG: 9.6, sugarsG: 9, saturatedFatG: 2.8, sodiumMg: 170 } },
    { slot: "Merienda - M5", name: "Skyr, avena, plátano, cacao y crema cacahuete", ingredients: "200 g skyr/yogur alto proteína; 30 g avena; 100 g plátano; 8 g cacao desgrasado; 10 g crema cacahuete", nutrition: { kcal: 409, proteinG: 32.2, carbsG: 57.3, fatG: 8.9, fiberG: 9.3, sugarsG: 21.5, saturatedFatG: 2.3, sodiumMg: 85 } },
    { slot: "Cena", name: "Ensalada de pollo y pasta", ingredients: "150 g pollo; 90 g pasta seca; 300 g verduras; 60 g pan; 10 g AOVE; 50 g yogur", nutrition: { kcal: 815, proteinG: 61.8, carbsG: 99.8, fatG: 18.1, fiberG: 16.4, sugarsG: 14.2, saturatedFatG: 3.6, sodiumMg: 515 } },
  ] },
  { day: 30, meals: [
    { slot: "05:00 - Bizcocho preentreno", name: "Bizcocho base", ingredients: "60 g avena; 50 g huevo; 100 g claras; 10 g chía; 100 g plátano", nutrition: { kcal: 494, proteinG: 30.1, carbsG: 67.8, fatG: 12.5, fiberG: 12.4, sugarsG: 13.6, saturatedFatG: 2.7, sodiumMg: 241 } },
    { slot: "Postentreno - Batido", name: "Batido de proteína", ingredients: "120 kcal / 20 g proteína. Carbohidratos, grasas, fibra, azúcares, saturadas y sodio: N/D hasta usar la etiqueta del batido.", nutrition: { kcal: 120, proteinG: 20, carbsG: null, fatG: null, fiberG: null, sugarsG: null, saturatedFatG: null, sodiumMg: null } },
    { slot: "Comida", name: "Pollo asiático", ingredients: "150 g pollo; 105 g arroz seco; 300 g verduras; 10 g AOVE; 15 g salsa soja; 10 g miel; 5 g sésamo", nutrition: { kcal: 818, proteinG: 49.2, carbsG: 111.1, fatG: 18.4, fiberG: 9.6, sugarsG: 18, saturatedFatG: 3.3, sodiumMg: 1003 } },
    { slot: "Merienda - M6", name: "Yogur alto en proteína, chia, avena y plátano", ingredients: "200 g skyr/yogur alto proteína; 15 g chía; 30 g avena; 100 g plátano", nutrition: { kcal: 405, proteinG: 30.6, carbsG: 57, fatG: 7.4, fiberG: 10.9, sugarsG: 20.5, saturatedFatG: 1.2, sodiumMg: 84 } },
    { slot: "Cena", name: "Pizza casera de pollo", ingredients: "150 g base pizza fina; 120 g pollo; 80 g mozzarella ligera; 100 g tomate; 150 g verduras", nutrition: { kcal: 780, proteinG: 62.1, carbsG: 90.3, fatG: 18, fiberG: 8.7, sugarsG: 12.7, saturatedFatG: 7.7, sodiumMg: 1262 } },
  ] },
];