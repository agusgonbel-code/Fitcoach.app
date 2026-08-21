# FitCoach — Auditoría profesional de producto y QA · 22/08/2026

## Visión
FitCoach debe comportarse como un sistema de coaching guiado, no como un simple registro. Un único intake recoge los datos del usuario/cliente y alimenta tanto nutrición como entrenamiento.

## Intake unificado
Datos corporales y objetivo; actividad; experiencia; días y duración disponibles; equipamiento; limitaciones/lesiones; preferencias, alergias/intolerancias, presupuesto, tiempo de cocina y número de comidas; medidas y fotos.

## Arquitectura objetivo
1. Perfil único normalizado.
2. Evidence Engine para energía, macros, volumen, RIR, progresión y recuperación.
3. Nutrition Planner con kcal repartidas entre comidas elegidas, proteína distribuida, recetas escalables por gramos y swaps dentro de tolerancia.
4. Training Planner para 2–6 días, límite de tiempo, objetivo, experiencia, material y limitaciones.
5. Progress Review con peso, adherencia, rendimiento, medidas y fotos.
6. Daily Coach que explique la siguiente mejor acción.

## Patrones de mercado adoptados
- Logging rápido y sin fricción.
- Programación automática según objetivo y disponibilidad.
- Adaptación por rendimiento/recuperación en vez de planes rígidos.
- Nutrición basada en objetivos y tendencia, no solo conteo aislado.
- Pantalla diaria con siguiente acción clara.

## Gates de QA
- El intake persiste y genera los mismos objetivos tras recargar.
- La suma de kcal de comidas coincide con el objetivo diario dentro del redondeo.
- Los macros de receta derivan de las mismas cantidades visibles.
- Un swap conserva tolerancia kcal/macros y restricciones.
- El entrenamiento respeta días, duración, material y limitaciones.
- Última carga/reps/RIR no se sobreescriben por los objetivos.
- La sesión en curso se recupera tras recarga.
- Fechas locales son estables cerca de medianoche y al cambiar de zona horaria.
- Las fotos permanecen locales salvo que se active explícitamente un servicio remoto.

## App Store
Bloquean release: privacidad, soporte, PrivacyInfo.xcprivacy, iconos/splash, build reproducible, accesibilidad, safe areas, enlaces legales, matriz de dispositivos y ausencia de placeholders.