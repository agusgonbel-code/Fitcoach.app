# FitCoach v6 — App Store release

## Product metadata

- Name: FitCoach
- Subtitle: Entrena, come y progresa
- Primary category: Health & Fitness
- Secondary category: Lifestyle
- Bundle ID: com.fitcoach.app
- Support URL: https://agusgonbel-code.github.io/Fitcoach.app/support.html
- Privacy URL: https://agusgonbel-code.github.io/Fitcoach.app/privacy.html
- Pricing for first release: Free
- In-app purchases / subscriptions: none in this release

## Keywords (es-ES)

fitness,entrenamiento,hipertrofia,musculación,nutrición,macros,recetas,gimnasio,progreso,recomposición

## App Store description (es-ES)

FitCoach reúne entrenamiento, nutrición y seguimiento en una sola aplicación. Completa un perfil único y genera un plan adaptado a tu objetivo, experiencia, tiempo disponible, material, preferencias alimentarias y limitaciones declaradas.

Entrenamiento: planes adaptativos, registro de cargas y repeticiones, RIR, historial, alternativas de ejercicios, progresión explicable y seguimiento de rendimiento.

Nutrición: cálculo de energía y macronutrientes, recetas con ingredientes y gramos reales, menú de 30 días, registro diario y validación de objetivos nutricionales.

Progreso: peso, métricas, fotografías guardadas localmente, comparaciones y tendencias.

Coach: recomendaciones prácticas basadas en los datos registrados en el dispositivo.

FitCoach no sustituye a un médico, dietista-nutricionista o profesional sanitario. Las estimaciones energéticas y corporales son orientativas.

## Review notes

FitCoach v6 is a privacy-first local fitness application. No account is required for the first release. Workout, nutrition, body metrics and progress photos are stored locally on the user's device. The app does not use advertising, tracking or third-party analytics in this release.

The unified onboarding is available on first launch and from Settings > Configurar usuario / cliente. It generates nutrition targets, a training plan and a 30-day menu from the same profile.

HealthKit is not enabled in this release, so the app does not request or write HealthKit data. If HealthKit is added later, the privacy manifest, privacy policy, App Store privacy answers and review notes must be updated before submission.

## App Review checklist

- [x] Public privacy policy exists.
- [x] Public support page exists.
- [x] PrivacyInfo.xcprivacy is included.
- [x] No account is required; therefore account-deletion UI is not required for this release.
- [x] No subscription or IAP is advertised or required.
- [x] No HealthKit permission is requested in this release.
- [x] Medical disclaimer is present in the product flow/content.
- [x] Native iOS CI compiles the Capacitor app for an iOS simulator without signing.
- [ ] Final archive must be signed with the owner's Apple Developer distribution identity.
- [ ] The signed build must be uploaded to App Store Connect / TestFlight.
- [ ] App Store Connect screenshots and final privacy questionnaire must be completed by the account holder/admin/app manager.

## Release gate

Do not submit if unit/audit CI, browser smoke, or iOS Native CI is red. Do not claim HealthKit, cloud sync, subscriptions or account features in App Store metadata until those features are actually shipped and their privacy declarations are updated.
