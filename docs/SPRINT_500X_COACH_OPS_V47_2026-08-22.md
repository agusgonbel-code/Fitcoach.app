# FitCoach — Sprint 500X Coach Ops v47

## Objetivo
Pasar de una cartera de clientes que muestra recomendaciones a una consola operativa que diga al entrenador quién necesita atención y cuál es la siguiente acción.

## Implementación
- Nuevo `coach-ops-v47.js`.
- Scoring operativo 0–100 por check-in ausente/vencido, adherencia, recuperación, sueño, rendimiento y hambre.
- Priorización critical/high/medium/low.
- Cola del entrenador ordenada por riesgo y urgencia.
- Siguiente acción explicable: check-in, revisión de fatiga, revisión nutricional o seguimiento normal.
- Aplicación conservadora de decisiones de volumen/deload sobre el plan, manteniendo todos los ejercicios.
- UI integrada en Coach Workspace.
- Inclusión del motor en PWA/offline y bundle iOS.

## Prueba como entrenador
Tests cubren cliente sin check-in, check-in vencido, cliente con baja adherencia/fatiga, orden de la cola y aplicación de un cambio de volumen sin eliminar ejercicios.

## Riesgos controlados
El motor no diagnostica lesiones ni toma decisiones clínicas. Prioriza atención y automatiza cambios previamente aceptados por el entrenador dentro de límites conservadores.

## Gates
Unit → CI → Browser Smoke → iOS Native CI → publicación Pages tras merge.
