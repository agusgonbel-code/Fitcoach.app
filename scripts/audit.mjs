import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const packageJson = JSON.parse(await read('package.json'));
const versionJson = JSON.parse(await read('version.json'));
const manifest = JSON.parse(await read('manifest.webmanifest'));
const capacitor = JSON.parse(await read('capacitor.config.json'));
const version = versionJson.version;

check(/^\d+\.\d+\.\d+$/.test(version), 'version.json debe usar una versión semántica.');
check(packageJson.version === version, `package.json (${packageJson.version}) no coincide con version.json (${version}).`);
check(manifest.version === version, `manifest.webmanifest (${manifest.version}) no coincide con version.json (${version}).`);
check(capacitor.webDir === 'www', 'capacitor.config.json debe usar www como webDir.');

const sourceFiles = [
  'index.html',
  'styles.css',
  'data.js',
  'nutrition-data.js',
  'exercise-equivalents.js',
  'app.js',
  'manifest.webmanifest',
  'version.json',
  'sw.js',
  'icon-192.png',
  'icon-512.png'
];

for (const file of sourceFiles) {
  try {
    await access(path.join(root, file));
  } catch {
    failures.push(`Falta el recurso publicable ${file}.`);
  }
}

const [index, app, serviceWorker, readme] = await Promise.all([
  read('index.html'),
  read('app.js'),
  read('sw.js'),
  read('README.md')
]);

check(index.includes(`<span>${version}</span>`), 'index.html no muestra la versión actual.');
check(app.includes(`./sw.js?v=${version}`), 'app.js debe registrar el service worker con la versión actual.');
for (const asset of ['styles.css', 'data.js', 'nutrition-data.js', 'exercise-equivalents.js', 'app.js', 'manifest.webmanifest']) {
  check(index.includes(`${asset}?v=${version}`), `index.html no referencia ${asset} con v=${version}.`);
}
check(serviceWorker.includes(`fitcoach-${version.replaceAll('.', '-')}`), 'La clave de caché del service worker no coincide con la versión.');
check(serviceWorker.includes(`?v=${version}`), 'El service worker no precarga recursos con la versión actual.');
check(readme.startsWith(`# FitCoach ${version}`), 'README.md no coincide con la versión actual.');

if (failures.length) {
  console.error('Auditoría fallida:');
  failures.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`FitCoach ${version}: auditoría correcta (${sourceFiles.length} recursos).`);
}
