# FitCoach 3.4.2

Aplicación de entrenamiento, nutrición y progreso con historial persistente, planificación por objetivos, progresión mediante RIR, menús de 30 días y comparación local de fotografías.

## Experiencia Daily Coach

- Inicio profesional con siguiente sesión, progreso semanal, macros restantes y tendencia de peso.
- Recomendaciones concretas según plan, entrenamientos y nutrición registrados.
- Última carga, repeticiones y RIR precargados en cada ejercicio.
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

Desde **Ajustes** se puede exportar y restaurar una copia completa versionada. Incluye perfil, objetivos, planes, entrenamientos, nutrición, medidas y las fotografías comprimidas de IndexedDB; la restauración valida todo el archivo y recupera el estado anterior si falla.


## Plan científico de 4 días · 50 minutos

Plan seleccionable en **Plan Studio → Científico 4 días · 50 min**. Alterna torso y pierna de lunes a jueves, prescribe 1–3 RIR, descansos de 60–150 segundos y progresión doble. Incluye alternativas para cada ejercicio y opciones de rango tolerable para la rodilla.

Base de evidencia: revisiones y metaanálisis sobre prescripción, volumen/frecuencia, proximidad al fallo y descansos (PMID 37414459, 41343037, 38970765 y 39205815).
