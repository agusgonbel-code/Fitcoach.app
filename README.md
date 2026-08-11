# FitCoach 3.4.2

Aplicación de entrenamiento, nutrición y progreso con historial persistente, planificación por objetivos, progresión mediante RIR, menús de 30 días y comparación local de fotografías.

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
