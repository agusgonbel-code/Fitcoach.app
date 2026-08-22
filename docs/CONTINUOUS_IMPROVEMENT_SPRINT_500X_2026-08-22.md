# FitCoach — Continuous Improvement Sprint 500X

Fecha: 2026-08-22

## Objetivo de producto
Convertir FitCoach de una app individual de entrenamiento/nutrición en una plataforma profesional entrenador–cliente con automatización supervisada.

## Benchmark funcional
Patrones contrastados frente a plataformas líderes de coaching: gestión de clientes, programación rápida, check-ins, seguimiento de adherencia, nutrición, automatización y decisiones revisables por el entrenador. La diferenciación de FitCoach es mantener el control humano sobre las recomendaciones automáticas.

## Arquitectura incorporada
- `client-engine-v35.js`: perfil único que genera nutrición, menú y entrenamiento.
- `adaptive-review-v36.js`: revisión semanal conservadora basada en tendencia, adherencia, rendimiento, recuperación, sueño y hambre.
- `coach-workspace-v40.js`: cartera de clientes, check-ins, riesgos, propuestas y registro auditable de decisiones.
- `weekly-review-ui-v36.js`: integra revisión individual y carga el workspace profesional.
- Bundle web/iOS actualizado para empaquetar todos los motores nuevos y permitir funcionamiento offline.

## Recorrido probado como entrenador
1. Crear perfil inicial.
2. Crear una ficha de cliente.
3. Registrar check-in semanal.
4. Generar recomendación.
5. Revisar kcal, volumen y posible descarga.
6. Aceptar o rechazar la propuesta.
7. Mantener historial de decisiones.

## Fallos encontrados y corregidos
- Selector nulo en la UI nutricional detectado por Browser Smoke en la ronda anterior.
- Parsing del workspace podía convertir campos vacíos en cero; corregido con normalización explícita.
- La UI del workspace usaba una utilidad fuera de su scope; corregido antes de publicar.
- El bundle móvil no incluía todos los motores v35/v36/v40; corregido en `scripts/sync-web.mjs`.
- El service worker no cacheaba la nueva arquitectura; actualizado a cache v40.

## Gates de calidad
- Tests unitarios de motor cliente.
- Tests de adaptación semanal.
- Tests específicos de workspace entrenador.
- Browser Smoke: onboarding + creación de cliente + check-in + persistencia.
- CI web.
- iOS Native CI.

## Riesgos pendientes antes de App Store
- Validación física final en iPhone.
- Firma Apple y Archive de distribución.
- Antes de multiusuario real en producción: backend autenticado, cifrado y separación de datos por entrenador/cliente. La versión web actual mantiene la cartera localmente y es adecuada para prototipo funcional/uso local, no para SaaS multiusuario remoto.

## Resultado del sprint
FitCoach pasa de ser una suma de módulos a un sistema de coaching supervisado: datos → plan → ejecución → check-in → recomendación → decisión del entrenador → siguiente ciclo.
