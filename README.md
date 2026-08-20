# FitCoach 3.4.3

Aplicación de entrenamiento, nutrición y progreso con historial persistente, planificación por objetivos, progresión mediante RIR, menús de 30 días y comparación local de fotografías.

## Experiencia Daily Coach

- Inicio profesional con siguiente sesión, progreso semanal, macros restantes y tendencia de peso.
- Recomendaciones concretas según plan, entrenamientos y nutrición registrados.
- Última carga, repeticiones y RIR precargados en cada ejercicio.
- Siguiente objetivo explicable mediante progresión doble: añade repeticiones, sube 2,5–5%, mantén o descarga según rango y RIR.
- RIR 0 se conserva correctamente y las sesiones vacías no pueden guardarse.
- Navegación optimizada para iPhone con iconos, áreas táctiles y safe area.

## Verificación

Requiere Node.js 22 o posterior.

```bash
npm ci
npm test
npm run audit
npm run sync:web
```

## Preparación para iPhone

```bash
npm run cap:add:ios
npm run ios:prepare
npm run cap:open:ios
```

La generación y firma final requieren macOS, Xcode y una cuenta de Apple Developer. Las fotografías de progreso se validan, comprimen y guardan localmente en el dispositivo.

Desde **Ajustes** se puede exportar y restaurar una copia completa versionada. El archivo usa la versión actual de FitCoach y la fecha local del iPhone. Incluye perfil, objetivos, planes, entrenamientos, nutrición, medidas y las fotografías comprimidas de IndexedDB; la restauración valida todo el archivo y recupera el estado anterior si falla.


## Plan científico de 4 días · 50 minutos

Plan seleccionable en **Plan Studio → Científico 4 días · 50 min**. Alterna torso y pierna de lunes a jueves, prescribe 1–3 RIR, descansos de 60–150 segundos y progresión doble. Incluye alternativas para cada ejercicio y opciones de rango tolerable para la rodilla.

Base de evidencia: revisiones y metaanálisis sobre prescripción, volumen/frecuencia, proximidad al fallo y descansos (PMID 37414459, 41343037, 38970765 y 39205815).


## Recuperación de entrenamientos en curso

FitCoach guarda localmente las cargas, repeticiones, RIR y notas mientras se completa cada sesión. Si Safari se recarga o iOS suspende la app, el borrador del mismo plan y día se restaura automáticamente. El borrador se elimina solo después de guardar una sesión válida y los borradores antiguos caducan a los 14 días.


## Guardado válido de sesiones

Antes de cerrar un entrenamiento, FitCoach exige al menos una serie completa, valida límites razonables y conserva correctamente RIR 0. Las series vacías no contaminan el historial ni las recomendaciones del Coach.

## Progresión de carga explicable

FitCoach analiza únicamente el historial local de cada ejercicio. Recomienda mantener la carga y sumar repeticiones dentro del rango, subirla cuando todas las series alcanzan el máximo con RIR controlado, o reducir aproximadamente un 5% ante esfuerzo excesivo o caída repetida. La sugerencia es informativa: nunca modifica automáticamente la sesión ni el historial.

## Perfil nutricional persistente

La calculadora conserva en el dispositivo sexo, edad, altura, peso, porcentaje de grasa, actividad, objetivo y fórmula. Al volver a abrir FitCoach muestra los mismos datos que originaron los macros y los incluye en la copia completa.

## Menú conectado con el diario

Cada receta y cada comida del plan de 30 días puede añadirse al registro del día con sus calorías, proteínas, carbohidratos y grasas ajustados a la porción. Las comidas planificadas quedan identificadas para impedir dobles registros accidentales y el resumen de Inicio se actualiza al instante.

El apartado **Diario** permite revisar cualquier fecha, ver kcal y los cuatro macronutrientes, corregir una entrada con validación o eliminarla después de una confirmación. Las operaciones conservan el origen del menú y no modifican otros días.

## Fechas locales fiables

Los registros diarios y el resumen de Nutrición usan la fecha civil del dispositivo, no UTC. El menú actual de 30 días también forma parte de la copia completa. Así, comidas, objetivos, medidas y fotografías de progreso permanecen en el día correcto aunque se guarden cerca de medianoche o se use el iPhone en otra zona horaria.
