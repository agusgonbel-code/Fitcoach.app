# FitCoach 2.3.0 — actualización correctiva

Este paquete corrige el problema de actualización detectado en FitCoach 2.2.0.

## Qué arregla

1. Elimina la referencia residual a `CROSS_WODS` que quedó en `app.js` después de separar Crosstraining.
2. Sube el runtime completo a `2.3.0`.
3. Sincroniza la versión en:
   - `app.js`
   - `index.html`
   - `manifest.webmanifest`
   - `package.json`
   - `version.json`
   - `sw.js`
4. Renueva la clave de caché del service worker.
5. Elimina la mención de Crosstraining del manifest de FitCoach.
6. Conserva los datos locales existentes.
7. Crea una copia de seguridad automática de los archivos antes de tocarlos.
8. Incluye una auditoría automática y un workflow de GitHub Actions.

## Aplicación

Coloca `apply-fitcoach-2.3.0.mjs` en la raíz del repositorio y ejecuta:

```bash
node apply-fitcoach-2.3.0.mjs
node scripts/audit-2.3.mjs
```

Después haz commit y push.

## En iPhone

Tras publicar la 2.3.0, abre FitCoach conectado a Internet. El service worker detectará la nueva versión. Si la PWA siguiera mostrando la versión anterior, ciérrala por completo y vuelve a abrirla. La nueva clave de caché evita que 2.2.0 y 2.3.0 se mezclen.

## Seguridad

El instalador no borra `localStorage`, entrenamientos, comidas, métricas, fotos, recuperación ni preferencias.
