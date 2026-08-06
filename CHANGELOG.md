# Changelog

## 1.6.0
- Nuevo WOD Studio exclusivo para Crosstraining.
- Biblioteca amplia sin material olímpico.
- Escalados por nivel, filtros de equipo y duración.
- Generación aleatoria y guardado de resultados/notas.
- Navegación y caché actualizadas.

## 1.3.6 - 2026-08-05
- Añadido control semanal de series por grupo muscular.
- Rangos de referencia distintos para hipertrofia, fuerza, Full Body, dosis mínima y Heavy Duty.
- Integración de RIR medio y readiness para detectar acumulación de fatiga.
- Recomendaciones de mantener, vigilar o descargar sin presentar un volumen universal como obligatorio.
- Nueva caché del service worker y carpeta www sincronizada.

## 1.3.5 - 2026-08-04
- Amplía la biblioteca de ejercicios y las rutinas de todas las modalidades.
- Añade rutinas específicas para Upper/Lower, Full Body, Powerbuilding, dosis mínima y cargas moderadas.
- Refuerza el guardado persistente de peso, repeticiones y RIR por ejercicio.
- Muestra el último entrenamiento y una sugerencia de progresión al repetir un ejercicio.
- Añade historial desplegable con todas las series.
- Mantiene recetas ajustadas con ingredientes, calorías, macros y preparación completa.
- Actualiza caché PWA y carpeta www.

## 1.3.4 - 2026-08-04
- Ajuste automático de porciones en todos los días del menú semanal.
- Corrección iterativa para minimizar diferencias calóricas entre días.
- Recetas y lista de compra muestran cantidades ajustadas.
- Se muestra la desviación calórica diaria respecto al objetivo.


## 1.3.3 - 2026-08-04
### Añadido
- Aviso de actualización disponible con recarga controlada de la aplicación.
- Validación básica de estructura al importar copias de seguridad.

### Mejorado
- Estrategia de caché para navegación y recursos locales.
- Exportación de copias de seguridad en Safari/iPhone.

### Corregido
- Se evita almacenar respuestas fallidas o recursos de otros dominios.
- Se evita que una copia JSON mal formada sustituya el estado interno.

## 1.3.7
- Añadidos ejercicios para pecho, espalda, hombros, brazos, piernas, glúteos y core.
- Selector modal de equivalencias que conserva series y repeticiones objetivo.
- Ampliada la biblioteca de recetas con nuevas opciones para todas las comidas.
- Plan mensual de 30 días con recetas ajustadas, resumen diario y lista de compra.
- El último plan nutricional generado queda guardado localmente.


## 1.4.0
- La biblioteca pasa de 40 a 200 recetas originales.
- Añadidas recetas innovadoras inspiradas en tendencias fitness sin copiar contenido protegido.
- Filtros de recetas por tipo de comida y tiempo máximo.
- Nuevas etiquetas, cocina, dificultad, fibra y tiempo de preparación.
- Los planes de 1, 3, 7 y 30 días usan la biblioteca ampliada y mantienen el ajuste de porciones.
- Caché del service worker actualizada.

## 1.5.0
- Selector de equivalentes reforzado.
- Nuevos métodos: PPL, PHUL, 5x5 adaptado, casa, circuito y especialización.
- Preferencias de dieta, presupuesto, tiempo, exclusiones y estrategia calórica.
- 300 recetas y mejor plan mensual con regeneración por día y métricas de calidad.


## 1.6.1
- Corregido el problema que impedía recibir actualizaciones en iPhone.
- Añadido banner de actualización que faltaba en HTML.
- Registro del service worker con `updateViaCache: none`.
- Comprobación al abrir, volver a la app y recuperar conexión.
- Caché de recursos principales en modo network-first.
