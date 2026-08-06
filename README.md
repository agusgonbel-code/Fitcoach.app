# FitCoach 2.0.1

Versión de producto reorganizada sobre la base estable 1.6.4.

## Novedades principales
- Autoguardado y recuperación de sesiones en curso.
- Historial persistente de peso, repeticiones y RIR por ejercicio.
- Selector de equivalentes corregido y persistente.
- 16 métodos de entrenamiento, incluidos superseries antagonistas y Torso/Pierna/Full Body.
- Planes de 2 a 6 días y sesiones de 30 a 75 minutos.
- Nutrición de 3 a 6 comidas, planes de 1, 3, 7, 14 o 30 días.
- Vista semanal navegable del plan mensual y regeneración de una semana completa.
- Preferencias veganas, pescetarianas, sin lactosa y sin gluten, exclusiones y alimentos preferidos.
- Crosstraining, métricas, fotos, importación/exportación y PWA conservados.

## Calidad
Ejecuta `npm run audit` para verificar sintaxis, IDs, datos, versiones y sincronización con `www`.

## Revisión 2.0.1
- Corrige el registro del service worker que aún apuntaba a 1.6.4.
- La comprobación remota usa ahora una constante de versión única.
- Auditoría reforzada para detectar referencias de versión obsoletas.
