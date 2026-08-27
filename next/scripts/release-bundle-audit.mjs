import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const fail = message => { throw new Error(`Release bundle audit failed: ${message}`); };

if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) fail('dist/ is missing; run the production build first');

const files = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else files.push(absolute);
  }
};
walk(dist);

if (!files.length) fail('dist/ is empty');

const relative = file => path.relative(dist, file).replaceAll(path.sep, '/');
const names = files.map(relative);
const sourceMaps = names.filter(name => name.endsWith('.map'));
if (sourceMaps.length) fail(`source maps must not ship in the RC: ${sourceMaps.join(', ')}`);

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.txt', '.webmanifest']);
const forbidden = [
  { pattern: /localhost(?::\d+)?/i, label: 'localhost URL/reference' },
  { pattern: /127\.0\.0\.1(?::\d+)?/i, label: 'loopback URL/reference' },
  { pattern: /0\.0\.0\.0(?::\d+)?/i, label: 'development bind address' },
  { pattern: /\/\/@vite\/client|@vite\/client/i, label: 'Vite development client' },
  { pattern: /sourceMappingURL=/i, label: 'source map directive' },
  // React production builds intentionally retain the DevTools integration hook so
  // installed DevTools can inspect a production renderer. Treating that stable
  // runtime hook as a debug artifact creates a false release failure. The actual
  // development-only React Refresh signatures below must never ship.
  { pattern: /@react-refresh|react-refresh\/runtime|__vite_plugin_react_preamble_installed__/i, label: 'React Refresh development runtime' },
  { pattern: /\$RefreshReg\$|\$RefreshSig\$/i, label: 'React Refresh instrumentation' },
];

for (const file of files) {
  if (!textExtensions.has(path.extname(file))) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) fail(`${rule.label} found in ${relative(file)}`);
  }
}

const indexPath = path.join(dist, 'index.html');
if (!fs.existsSync(indexPath)) fail('dist/index.html is missing');
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('<title>FitCoach Next</title>')) fail('production index title is incorrect');
if (!index.includes('viewport-fit=cover')) fail('production index lost iPhone safe-area viewport configuration');

const localRefs = [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map(match => match[1])
  .filter(ref => ref && !ref.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(ref));
for (const ref of localRefs) {
  const clean = ref.split(/[?#]/, 1)[0].replace(/^\.\//, '').replace(/^\//, '');
  if (!clean) continue;
  const target = path.join(dist, clean);
  if (!fs.existsSync(target)) fail(`index references missing production asset: ${ref}`);
}

const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (totalBytes > 15 * 1024 * 1024) fail(`web bundle is unexpectedly large (${(totalBytes / 1024 / 1024).toFixed(2)} MiB)`);

console.log(`FitCoach Next bundle audit OK · ${files.length} files · ${(totalBytes / 1024).toFixed(1)} KiB · no debug/dev artifacts`);
