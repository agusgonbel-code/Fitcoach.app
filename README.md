# FitCoach Stable 1.0

Reconstrucción completa orientada a estabilidad.

## Funciones comprobables
- Navegación estable entre cinco módulos.
- Planes de recomposición, hipertrofia, fuerza y pérdida de grasa.
- Programa basado en evidencia, Heavy Duty inspirado en Mentzer, powerbuilding y dosis mínima.
- Registro de peso, repeticiones, RIR, volumen e historial.
- Temporizador de descanso.
- Biblioteca de ejercicios con técnica, errores y alternativas.
- Calculadora Mifflin-St Jeor y Katch-McArdle.
- Menús de 1, 3 o 7 días según calorías y proteína.
- Recetas reales con ingredientes y pasos.
- Diario nutricional.
- Métricas corporales y gráfica.
- Fotos desde Fotos/Archivos y cámara.
- Comparación lado a lado.
- Tema claro y oscuro.
- Exportación e importación.

## Sobre la comparación con IA
La versión local no simula una IA visual. Una comparación real mediante modelo de visión requiere backend seguro, consentimiento, política de privacidad y almacenamiento protegido.

## Subida a GitHub
Sustituye todos los archivos de la raíz por los de este ZIP.

Commit recomendado:

`FitCoach Stable 1.0 - Full rebuild and stability release`


## Comparación con IA real

La versión 1.1 añade:
- Selección de dos fotos ya guardadas.
- Consentimiento explícito antes del envío.
- Envío al backend únicamente al pulsar analizar.
- Resumen, cambios observables, limitaciones y recomendaciones.
- Sin estimación clínica de grasa corporal.

### Backend

La carpeta `backend` está preparada para Vercel.

1. Sube la carpeta `backend` a un proyecto de Vercel.
2. Añade la variable secreta `OPENAI_API_KEY`.
3. Opcionalmente añade `OPENAI_MODEL`.
4. Despliega.
5. Copia la URL:
   `https://TU-PROYECTO.vercel.app/api/analyze-photos`
6. Pégala en FitCoach → Ajustes → URL del backend de IA.

La clave API nunca debe guardarse en `app.js`, GitHub Pages ni en el navegador.
