# FitCoach Pro Pack — 2026-08-09

Este paquete contiene una mejora acumulativa sin borrar datos ni reconstruir la aplicación.

Archivos:
- `compat.js`: corrige el arranque tras la extracción de Crosstraining.
- `pro.js`: añade Coach 360, métricas de adherencia, readiness, tendencia de peso, récords e1RM, auditoría local y copia segura.
- `sw.js`: reemplazo del service worker para precargar e inyectar automáticamente ambos módulos.

Problema detectado en el código actual:
`app.js` sigue evaluando `CROSS_WODS` durante `init()` aunque Crosstraining fue extraído. Si esa variable no existe, puede romper el arranque. `compat.js` lo neutraliza sin reintroducir Crosstraining.

El conector de GitHub permite lectura del repositorio, pero la API de escritura devuelve HTTP 403 `Resource not accessible by integration`. ChatGPT ya tiene permiso interno `full_access`; el bloqueo restante pertenece al alcance de escritura de la instalación GitHub App.
