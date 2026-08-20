import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const packageJson = JSON.parse(await read('package.json'));
const packageLock = JSON.parse(await read('package-lock.json'));
const versionJson = JSON.parse(await read('version.json'));
const manifest = JSON.parse(await read('manifest.webmanifest'));
const capacitor = JSON.parse(await read('capacitor.config.json'));
const release = JSON.parse(await read('app-store/release.json'));
const storeMetadata = JSON.parse(await read('app-store/metadata.es-ES.json'));
const version = versionJson.version;

check(/^\d+\.\d+\.\d+$/.test(version), 'version.json debe usar versión semántica.');
check(packageJson.version === version, 'package.json no coincide con version.json.');
check(packageJson.engines?.node === '>=22.0.0', 'package.json debe exigir Node >=22.0.0 para Capacitor 8.');
check(manifest.version === version, 'manifest.webmanifest no coincide con version.json.');
check(capacitor.webDir === 'www', 'Capacitor debe usar www como webDir.');
check(/^([a-zA-Z][\w]*)(\.[a-zA-Z][\w]*)+$/.test(capacitor.appId), 'Capacitor debe usar un appId válido.');
check(typeof capacitor.appName === 'string' && capacitor.appName.trim(), 'Capacitor debe declarar appName.');
check(release.bundleId === capacitor.appId, 'El bundleId de App Store no coincide con Capacitor.');
check(release.marketingVersion === version, 'La versión de App Store no coincide con FitCoach.');
check(Number.isInteger(release.buildNumber) && release.buildNumber > 0, 'El build de App Store debe ser un entero positivo.');
check(storeMetadata.name === capacitor.appName, 'El nombre de App Store no coincide con Capacitor.');
check(storeMetadata.name.length <= 30, 'El nombre supera 30 caracteres.');
check(storeMetadata.subtitle.length <= 30, 'El subtítulo supera 30 caracteres.');
check(storeMetadata.promotionalText.length <= 170, 'El texto promocional supera 170 caracteres.');
check(storeMetadata.keywords.length <= 100, 'Las palabras clave superan 100 caracteres.');
check(storeMetadata.description.length <= 4000, 'La descripción supera 4000 caracteres.');

const capacitorPackages = [
  ['dependencies', '@capacitor/core'],
  ['dependencies', '@capacitor/ios'],
  ['devDependencies', '@capacitor/cli']
];
const capacitorVersion = packageJson.dependencies?.['@capacitor/core'];
check(/^\d+\.\d+\.\d+$/.test(capacitorVersion ?? ''), '@capacitor/core debe fijar una versión exacta.');
for (const [group, name] of capacitorPackages) {
  check(packageJson[group]?.[name] === capacitorVersion, `${name} no coincide con @capacitor/core.`);
  check(packageLock.packages?.['']?.[group]?.[name] === capacitorVersion, `package-lock no fija ${name}.`);
  check(packageLock.packages?.[`node_modules/${name}`]?.version === capacitorVersion, `package-lock no resuelve ${name} ${capacitorVersion}.`);
}

const webFiles = [
  'index.html', 'privacy.html', 'support.html', 'styles.css', 'enhance-v34.css', 'daily-coach-v34.css', 'data.js',
  'nutrition-data.js', 'exercise-equivalents.js', 'local-date-v345.js', 'app.js',
  'nutrition-data-gen-v34.js', 'nutrition-profile-v346.js', 'nutrition-log-v347.js', 'nutrition-ui-v34.js', 'photo-storage-v34.js', 'progress-v34.js', 'backup-v34.js', 'progression-engine-v34.js', 'daily-coach-v34.js',
  'evidence-plan-v342.js', 'workout-draft-v343.js', 'workout-save-v344.js', 'manifest.webmanifest', 'version.json', 'sw.js',
  'icon-192.png', 'icon-512.png'
];

for (const file of webFiles) {
  try { await access(path.join(root, file)); }
  catch { failures.push(`Falta el recurso publicable ${file}.`); }
}

const [index, app, nutrition, nutritionLog, dailyCoach, progress, backup, serviceWorker, readme] = await Promise.all([
  read('index.html'), read('app.js'), read('nutrition-ui-v34.js'), read('nutrition-log-v347.js'), read('daily-coach-v34.js'), read('progress-v34.js'), read('backup-v34.js'), read('sw.js'), read('README.md')
]);

check(index.includes(`<span>${version}</span>`), 'La cabecera no muestra la versión actual.');
check(readme.includes(`# FitCoach ${version}`), 'README no coincide con la versión actual.');
check(app.includes(`./sw.js?v=${version}`), 'app.js registra otra versión del service worker.');
check(serviceWorker.includes(`fitcoach-${version.replaceAll('.', '-')}`), 'La caché no coincide con la versión.');
check(nutrition.includes('FitCoachLocalDate?.localDateKey'), 'Nutrición debe usar la fecha local del dispositivo.');
check(nutrition.includes('FitCoachNutritionLog'), 'Nutrición debe registrar recetas mediante el diario validado.');
check(nutrition.includes('fitcoach:meals-changed'), 'Nutrición debe sincronizar el diario con Inicio.');
check(nutrition.includes('data-meal-id'), 'Nutrición debe mostrar el detalle editable del diario.');
check(nutrition.includes('Confirmar eliminación'), 'Nutrición debe exigir confirmación antes de eliminar.');
check(nutritionLog.includes('function migrateMeals'), 'El diario debe migrar registros antiguos a identificadores seguros.');
check(nutritionLog.includes('function updateMeal'), 'El diario debe permitir correcciones validadas.');
check(nutritionLog.includes('function removeMeal'), 'El diario debe permitir eliminar por identificador estable.');
check(dailyCoach.includes("addEventListener('fitcoach:meals-changed', renderDashboard)"), 'Inicio debe reaccionar al editar el diario.');
check(!nutrition.includes("new Date().toISOString().slice(0,10)"), 'Nutrición conserva una fecha UTC insegura.');
check(backup.includes("'v34menu'"), 'La copia no incluye el menú actual de 30 días.');
check(backup.includes("'fitcoach_nutrition_profile_v34'"), 'La copia no incluye el perfil de la calculadora nutricional.');
check(progress.includes('FitCoachLocalDate.localDateKey()'), 'Progreso debe usar la fecha local del dispositivo.');
check(!progress.includes("new Date().toISOString().slice(0,10)"), 'Progreso conserva una fecha UTC insegura.');
check(backup.includes(`const APP_VERSION = '${version}'`), 'Las copias no coinciden con la versión actual.');
check(backup.includes('FitCoachLocalDate?.localDateKey'), 'Las copias deben usar la fecha local del dispositivo.');
check(!backup.includes("new Date().toISOString().slice(0, 10)"), 'El nombre de la copia conserva una fecha UTC insegura.');
const [privacyPage, supportPage, privacyManifest] = await Promise.all([
  read('privacy.html'), read('support.html'), read('PrivacyInfo.xcprivacy')
]);
check(index.includes('href="privacy.html"'), 'Ajustes debe enlazar la política de privacidad.');
check(index.includes('href="support.html"'), 'Ajustes debe enlazar soporte.');
check(privacyPage.includes('No recopilamos datos personales'), 'La política debe explicar qué datos recopila FitCoach.');
check(privacyPage.includes('IndexedDB'), 'La política debe explicar el almacenamiento local de fotografías.');
check(supportPage.includes('Fitcoach.app/issues/new'), 'Soporte debe ofrecer un canal público.');
check(/<key>NSPrivacyTracking<\/key>\s*<false\/>/.test(privacyManifest), 'El manifiesto debe declarar que no hay seguimiento.');
check(/<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/.test(privacyManifest), 'El manifiesto debe declarar que FitCoach no recopila datos.');
for (const asset of webFiles.filter(file => file !== 'sw.js' && /\.(?:css|js)$/.test(file))) {
  check(index.includes(`${asset}?v=${version}`), `index.html no referencia ${asset} con v=${version}.`);
}
for (const match of index.matchAll(/[?&]v=(\d+\.\d+\.\d+)/g)) {
  check(match[1] === version, `index.html conserva un recurso v=${match[1]}.`);
}
for (const match of serviceWorker.matchAll(/[?&]v=(\d+\.\d+\.\d+)/g)) {
  check(match[1] === version, `sw.js conserva un recurso v=${match[1]}.`);
}

if (failures.length) {
  console.error('Auditoría fallida:');
  failures.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`FitCoach ${version}: auditoría correcta (${webFiles.length} recursos, Capacitor ${capacitorVersion}).`);
}
