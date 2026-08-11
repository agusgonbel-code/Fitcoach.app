import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const packageJson = JSON.parse(await read('package.json'));
const versionJson = JSON.parse(await read('version.json'));
const manifest = JSON.parse(await read('manifest.webmanifest'));
const capacitor = JSON.parse(await read('capacitor.config.json'));
const version = versionJson.version;

check(/^\d+\.\d+\.\d+$/.test(version), 'version.json debe usar versión semántica.');
check(packageJson.version === version, 'package.json no coincide con version.json.');
check(manifest.version === version, 'manifest.webmanifest no coincide con version.json.');
check(capacitor.webDir === 'www', 'Capacitor debe usar www como webDir.');

const webFiles = [
  'index.html', 'styles.css', 'enhance-v34.css', 'data.js',
  'nutrition-data.js', 'exercise-equivalents.js', 'app.js',
  'nutrition-data-gen-v34.js', 'nutrition-ui-v34.js', 'progress-v34.js',
  'manifest.webmanifest', 'version.json', 'sw.js',
  'icon-192.png', 'icon-512.png'
];

for (const file of webFiles) {
  try { await access(path.join(root, file)); }
  catch { failures.push(`Falta el recurso publicable ${file}.`); }
}

const [index, app, serviceWorker] = await Promise.all([
  read('index.html'), read('app.js'), read('sw.js')
]);

check(index.includes(`<span>${version}</span>`), 'La cabecera no muestra la versión actual.');
check(app.includes(`./sw.js?v=${version}`), 'app.js registra otra versión del service worker.');
check(serviceWorker.includes(`fitcoach-${version.replaceAll('.', '-')}`), 'La caché no coincide con la versión.');
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
  console.log(`FitCoach ${version}: auditoría correcta (${webFiles.length} recursos).`);
}
