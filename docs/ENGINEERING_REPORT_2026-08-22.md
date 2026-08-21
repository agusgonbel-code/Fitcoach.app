# FitCoach — Informe de ingeniería, producto y QA
Fecha: 22/08/2026

## 1. Objetivo de producto
FitCoach debe ser un coach digital guiado. El usuario o entrenador crea un único perfil; ese perfil alimenta simultáneamente la nutrición, el entrenamiento, el seguimiento y las recomendaciones del Daily Coach.

## 2. Arquitectura funcional
### Perfil único
Recoge: usuario/cliente, nombre, sexo, edad, altura, peso, grasa opcional, actividad, objetivo, experiencia, días, minutos por sesión, material, limitaciones, comidas/día, patrón de reparto, estilo alimentario, alergias/intolerancias, alimentos a evitar, presupuesto y tiempo de cocina. Las fotos permanecen en Progreso y se almacenan localmente.

### Motor nutricional
- Estima BMR con Mifflin-St Jeor o Katch-McArdle cuando hay dato de composición corporal.
- Estima mantenimiento y aplica ajuste según objetivo.
- Define proteína y grasa por peso; carbohidratos completan la energía.
- Reparte kcal y macros exactamente entre 3–6 comidas.
- Permite reparto equilibrado o sesgo hacia desayuno/comida/cena.
- Escala cantidades de ingredientes y recalcula nutrientes desde esas cantidades.
- Genera 30 días con control básico de repetición y restricciones.

### Motor de entrenamiento
- Genera 2–6 sesiones/semana.
- Respeta duración máxima, material, experiencia y limitaciones declaradas.
- Usa rangos de repeticiones, 1–3 RIR y descansos diferenciados.
- Aplica doble progresión y recomienda descarga/reducción ante esfuerzo excesivo o caída repetida.
- Conserva historial, cargas, repeticiones y RIR existentes.

### Daily Coach
Debe evolucionar a una capa de decisión que use: adherencia nutricional, tendencia de peso, cumplimiento de entrenamiento, rendimiento, RIR y recuperación. Las decisiones deben ser explicables y no modificar el historial retrospectivamente.

### Progreso
Peso, medidas, sesiones, marcas y fotos locales. Backup/restore versionado debe conservar todos los datos.

## 3. Hallazgos QA
- El generador legado tenía reparto rígido de músculos/series.
- La nutrición legada usaba porcentajes fijos por número de comidas.
- Existían calculadora, plan científico e historial, pero como piezas separadas.
- La nueva arquitectura reutiliza esas piezas y añade una fuente única de verdad.

## 4. Cambios de esta iteración
- `client-engine-v35.js`: motor común nutrición + entrenamiento + menú.
- `unified-intake-v35.js`: wizard único para usuario/cliente.
- Integración compatible a través de `local-date-v345.js`.
- Tests de invariantes: reparto exacto de macros, cálculo energético y restricciones de entrenamiento.
- Browser smoke test en Chromium para apertura, recorrido, generación y persistencia.

## 5. QA obligatorio antes de release
1. Unit/invariant tests.
2. Browser smoke sin `pageerror`.
3. CI general.
4. Compilación iOS nativa.
5. Prueba iPhone pequeño/grande y iPad.
6. Validación de backup/restore, fotos, offline y fechas locales.
7. Revisión de accesibilidad, safe areas y enlaces legales.

## 6. App Store
Requiere privacidad accesible dentro de la app y URL válida, PrivacyInfo.xcprivacy coherente con la implementación, soporte funcional, iconos/splash, screenshots, metadata final, build firmado y prueba en dispositivo real. La firma y subida final dependen de Apple Developer/App Store Connect.

## 7. Riesgos pendientes
- El generador de menús v35 debe pasar browser QA con el catálogo real completo.
- Las alergias deben evolucionar de búsqueda textual a etiquetas estructuradas por ingrediente/alérgeno antes de llamarlo clínicamente robusto.
- El ajuste automático por tendencia de peso debe exigir varias mediciones y límites conservadores; no debe reaccionar a un solo día.
- No debe presentarse el análisis de fotos como diagnóstico médico.