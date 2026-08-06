# Changelog

## 2.0.2 — Runtime Stability
- Arranque tolerante: un fallo en un módulo ya no bloquea toda la aplicación.
- Avisos visibles para errores de carga y almacenamiento.
- Guardado local protegido frente a cuota llena o Safari en modo restringido.
- Fotos comprimidas antes de guardarse para reducir fallos por falta de espacio.
- Recuperación segura si una foto no puede persistirse.
- Scripts cargados al final del documento y arranque válido aunque DOMContentLoaded ya haya ocurrido.
- Versiones y caché unificadas.

# Changelog

## 2.0.1 — Version Audit
- Corregido el registro del service worker, que conservaba `v=1.6.4`.
- Corregida la comparación de `version.json`, que seguía usando `1.6.4`.
- Añadida constante `APP_VERSION` y validación automática de coherencia.
- Actualizados recursos, manifest, caché y carpeta `www`.

## 2.0.0 — Product Foundation
- Corrección del fallo de sintaxis por declaración duplicada en el cálculo de volumen semanal.
- Corrección de fecha en el selector de equivalentes.
- Autoguardado de entrenamientos en curso.
- Dos nuevos métodos de entrenamiento y más opciones de días/duración.
- Nutrición ampliada a 3-6 comidas, 14 días y preferencias dietéticas adicionales.
- Navegación semanal del menú mensual y regeneración semanal.
- Importación ampliada para historial de Crosstraining y plan nutricional.
- Versión y caché unificadas como 2.0.0.
