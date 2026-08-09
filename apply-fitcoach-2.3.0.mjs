import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_VERSION = '2.3.0';
const OLD_VERSION = '2.2.0';
const CACHE_NAME = 'fitcoach-2-3-0-runtime-update-v1';

const mustExist = [
  'app.js',
  'index.html',
  'manifest.webmanifest',
  'package.json',
  'sw.js',
  'version.json',
  'README.md',
  'CHANGELOG.md'
];

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

for (const file of mustExist) {
  if (!fs.existsSync(path.join(ROOT, file))) fail(`No encuentro ${file}. Ejecuta este instalador desde la raíz del repositorio FitCoach.`);
}

const backupDir = path.join(ROOT, `.fitcoach-backup-${Date.now()}`);
fs.mkdirSync(backupDir, { recursive: true });
for (const file of mustExist) {
  fs.copyFileSync(path.join(ROOT, file), path.join(backupDir, file.replaceAll('/', '__')));
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}
function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content, 'utf8');
}
function replaceAllVersion(text) {
  return text.replaceAll(OLD_VERSION, TARGET_VERSION).replaceAll('FitCoach 2.2', 'FitCoach 2.3');
}

let app = read('app.js');

// 1) Corrección crítica: Crosstraining fue extraído, pero el arranque aún comprobaba CROSS_WODS.
const crossPatterns = [
  /\s*if\s*\(\s*!CROSS_WODS\.length\s*\)\s*dataProblems\.push\(['"]WODs['"]\);?\s*/g,
  /\s*if\s*\(\s*CROSS_WODS\.length\s*===\s*0\s*\)\s*dataProblems\.push\(['"]WODs['"]\);?\s*/g
];

let crossRemoved = false;
for (const pattern of crossPatterns) {
  const before = app;
  app = app.replace(pattern, '\n');
  if (before !== app) crossRemoved = true;
}

if (/CROSS_WODS/.test(app)) {
  fail('Sigue existiendo una referencia a CROSS_WODS en app.js. No aplico una actualización parcial.');
}

// 2) Versionado coherente.
app = replaceAllVersion(app);
write('app.js', app);

let index = replaceAllVersion(read('index.html'));
index = index
  .replace('Nuevos métodos avanzados, auditoría reforzada y planes de 2 a 6 días con progresión e historial persistentes.',
           'Arranque saneado, actualización PWA reforzada y planes de 2 a 6 días con progresión e historial persistentes.');
write('index.html', index);

let manifest;
try {
  manifest = JSON.parse(read('manifest.webmanifest'));
} catch {
  fail('manifest.webmanifest no es JSON válido.');
}
manifest.name = `FitCoach ${TARGET_VERSION}`;
manifest.version = TARGET_VERSION;
manifest.description = 'Entrenamiento adaptativo, nutrición, progreso y seguimiento para iPhone.';
write('manifest.webmanifest', JSON.stringify(manifest, null, 2) + '\n');

let pkg;
try {
  pkg = JSON.parse(read('package.json'));
} catch {
  fail('package.json no es JSON válido.');
}
pkg.version = TARGET_VERSION;
write('package.json', JSON.stringify(pkg, null, 2) + '\n');

let versionJson;
try {
  versionJson = JSON.parse(read('version.json'));
} catch {
  fail('version.json no es JSON válido.');
}
versionJson.version = TARGET_VERSION;
versionJson.cache = CACHE_NAME;
write('version.json', JSON.stringify(versionJson, null, 2) + '\n');

let sw = read('sw.js');
sw = replaceAllVersion(sw);
sw = sw.replace(
  /const CACHE\s*=\s*['"][^'"]+['"]\s*;/,
  `const CACHE = '${CACHE_NAME}';`
);
if (!sw.includes(`styles.css?v=${TARGET_VERSION}`) ||
    !sw.includes(`data.js?v=${TARGET_VERSION}`) ||
    !sw.includes(`app.js?v=${TARGET_VERSION}`)) {
  fail('No he podido verificar el versionado de los recursos principales en sw.js.');
}
write('sw.js', sw);

let readme = read('README.md');
readme = replaceAllVersion(readme);
readme = readme.replace(/^# FitCoach[^\n]*/m, `# FitCoach ${TARGET_VERSION}`);
if (!readme.includes('Runtime 2.3')) {
  readme += `

## Runtime 2.3
- Eliminada la dependencia residual de Crosstraining durante el arranque.
- Versionado coherente entre HTML, app, manifest, service worker y version.json.
- Caché PWA renovada para evitar mezclar archivos de versiones anteriores.
- Mantiene los datos locales existentes.
`;
}
write('README.md', readme.trimEnd() + '\n');

let changelog = read('CHANGELOG.md');
if (!changelog.includes('## 2.3.0')) {
  const entry = `# Changelog

## 2.3.0 — Clean Update Runtime
- Eliminada la referencia residual a \`CROSS_WODS\` tras separar Crosstraining de FitCoach.
- Arranque de FitCoach independiente de CrossCoach.
- Versionado unificado a 2.3.0 en app, HTML, manifest, package, version.json y service worker.
- Nueva clave de caché PWA para impedir que Safari mezcle recursos 2.2.0 y 2.3.0.
- Descripción del manifest corregida: FitCoach ya no anuncia Crosstraining integrado.
- Se conservan entrenamientos, nutrición, métricas, fotos, preferencias e historial guardados localmente.

`;
  // Evita duplicar "# Changelog" si ya existe.
  changelog = changelog.replace(/^# Changelog\s*/m, '');
  changelog = entry + changelog.trimStart();
}
write('CHANGELOG.md', changelog.trimEnd() + '\n');

// 3) Auditoría final.
const audit = {
  appVersion: /const APP_VERSION\s*=\s*['"]2\.3\.0['"]/.test(read('app.js')),
  noCrossWods: !/CROSS_WODS/.test(read('app.js')),
  indexVersion: read('index.html').includes('2.3.0'),
  manifestVersion: JSON.parse(read('manifest.webmanifest')).version === TARGET_VERSION,
  packageVersion: JSON.parse(read('package.json')).version === TARGET_VERSION,
  versionJson: JSON.parse(read('version.json')).version === TARGET_VERSION,
  swVersionedAssets:
    read('sw.js').includes(`styles.css?v=${TARGET_VERSION}`) &&
    read('sw.js').includes(`data.js?v=${TARGET_VERSION}`) &&
    read('sw.js').includes(`app.js?v=${TARGET_VERSION}`),
  newCache: read('sw.js').includes(CACHE_NAME)
};

const failed = Object.entries(audit).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) fail(`Auditoría fallida: ${failed.join(', ')}`);

console.log('\n✅ FitCoach actualizado correctamente a 2.3.0');
console.log(`✅ CROSS_WODS eliminado del arranque`);
console.log(`✅ Caché PWA: ${CACHE_NAME}`);
console.log(`✅ Copia de seguridad: ${path.basename(backupDir)}`);
console.log(`✅ Datos del usuario: no se borran`);
console.log('\nSiguiente paso: commit/push de los archivos modificados y volver a abrir la PWA.');
