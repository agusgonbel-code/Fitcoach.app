# Changelog

## 3.4.4 (1) · Identidad de distribución y metadatos

- Fija versión `3.4.4` y build `1` en el proyecto iOS generado.
- Valida ambas claves en el `Info.plist` de la aplicación compilada.
- Añade una ficha española de App Store sin textos provisionales.
- Comprueba automáticamente los límites editoriales de Apple.
- No modifica funciones ni datos de FitCoach.


## 3.4.4 · Preparación de privacidad para App Store

- Añade política de privacidad y soporte públicos, accesibles desde Ajustes.
- Incluye `PrivacyInfo.xcprivacy` en el target nativo sin declarar seguimiento ni recopilación.
- Verifica en macOS que el manifiesto y las páginas legales forman parte de `FitCoach.app`.
- No modifica datos, entrenamiento, nutrición, progreso ni copias existentes.


## 3.4.4 · Diario nutricional editable

- Muestra el detalle de todas las comidas del día y los totales de calorías, proteína, carbohidratos y grasas.
- Permite corregir una entrada mediante validación de nombre y rangos nutricionales.
- Permite eliminarla únicamente tras una confirmación explícita en dos pasos.
- Migra de forma compatible las comidas anteriores a identificadores locales estables.
- Sincroniza cualquier corrección con el resumen de Inicio y las copias completas.

## 3.4.3 · Menú conectado con el diario

- Cada comida del menú mensual abre su receta completa y permite registrarla en el diario del día con la porción y los macros reales del plan.
- Los registros procedentes del menú guardan su día y posición de origen para impedir duplicados accidentales sin limitar las recetas añadidas manualmente.
- El resumen diario y el inicio se actualizan al guardar, manteniendo la persistencia local y el funcionamiento sin conexión.

## 3.4.3 · Perfil nutricional persistente

- Conserva todos los campos que originan el cálculo de macros.
- Valida límites razonables antes de calcular.
- Incluye el perfil nutricional en las copias completas.


## 3.4.3 — Recuperación de sesiones en iPhone
- Nutrición agrupa las comidas por la fecha local del iPhone, incluso cerca de medianoche.
- La copia completa incluye el menú generado por la interfaz nutricional actual.
- Copias identificadas con la versión 3.4.3 y la fecha local del iPhone.
- Auditoría automática contra versiones obsoletas y nombres basados en UTC.
- Borrador local separado por plan y día para cargas, repeticiones, RIR y notas.
- Restauración automática tras recarga, cierre de Safari o suspensión de iOS.
- Limpieza del borrador únicamente después de guardar una sesión válida.
- Caducidad segura de borradores antiguos a los 14 días.
- Nueva prueba automática y auditoría del recurso en el bundle web/Capacitor.

## 3.4.2 — iPhone Photo Storage Safety
- Fotos de progreso validadas y comprimidas antes de guardarse en IndexedDB.
- Compatibilidad controlada con JPG, PNG, WebP y HEIC/HEIF.
- Límite de entrada de 25 MB y de almacenamiento de 5 MB por foto comprimida.
- Limpieza de Object URLs en galería y comparación para evitar fugas de memoria.
- Pruebas automáticas de formatos, límites y dimensiones.
- README y paquete publicable alineados con 3.4.2.
- Copia de seguridad versionada con perfil, planes, entrenamientos, nutrición, medidas y fotos de IndexedDB.
- Restauración validada con límites de tamaño, claves permitidas y reversión al estado anterior ante fallo.
- Nuevo panel Daily Coach con sesión de hoy, progreso semanal, macros pendientes y tendencia de peso.
- Entrenamiento guiado con precarga del último registro, validación de series y conservación de RIR 0.
- Navegación y jerarquía visual renovadas para iPhone.

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

## 2.1.0
- Crosstraining extraído a una app independiente.
- +42 ejercicios estructurados.
- +100 recetas originales.
- Limpieza de navegación, caché y recursos.

## 2.2.0
- Auditoría reparada tras extraer Crosstraining (ya no exige cross.js).
- Nuevos métodos PHAT adaptado, Arnold Split adaptado, DUP y PPL 6 días.
- Planes avanzados compatibles con historial, RIR, equivalencias y autoguardado existentes.
- Versionado y caché actualizados.
