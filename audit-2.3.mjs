import fs from 'node:fs';

const V = '2.3.0';
const files = ['app.js','index.html','manifest.webmanifest','package.json','sw.js','version.json'];
const missing = files.filter(f => !fs.existsSync(f));
if (missing.length) {
  console.error('❌ Faltan archivos:', missing.join(', '));
  process.exit(1);
}

const app = fs.readFileSync('app.js','utf8');
const index = fs.readFileSync('index.html','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const version = JSON.parse(fs.readFileSync('version.json','utf8'));

const checks = [
  ['APP_VERSION', new RegExp(`const APP_VERSION\\s*=\\s*['"]${V.replaceAll('.','\\.')}['"]`).test(app)],
  ['Sin CROSS_WODS', !/CROSS_WODS/.test(app)],
  ['index 2.3.0', index.includes(V)],
  ['manifest 2.3.0', manifest.version === V],
  ['package 2.3.0', pkg.version === V],
  ['version.json 2.3.0', version.version === V],
  ['SW CSS versionado', sw.includes(`styles.css?v=${V}`)],
  ['SW data versionado', sw.includes(`data.js?v=${V}`)],
  ['SW app versionado', sw.includes(`app.js?v=${V}`)],
  ['Caché 2.3.0', /fitcoach-2-3-0/.test(sw)]
];

for (const [name, ok] of checks) console.log(`${ok ? '✅' : '❌'} ${name}`);
if (checks.some(([,ok]) => !ok)) process.exit(1);
console.log('\n✅ Auditoría FitCoach 2.3.0 superada.');
