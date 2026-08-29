import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file));
const readText = file => read(file).toString('utf8');
const fail = message => { throw new Error(`Release audit failed: ${message}`); };

const pkg = JSON.parse(readText('package.json'));
if (!/^\d+\.\d+\.\d+-rc\.\d+$/.test(pkg.version)) fail(`version ${pkg.version} is not an RC semantic version`);
if (!fs.existsSync(path.join(root, 'package-lock.json'))) fail('package-lock.json is missing');

for (const [group, deps] of Object.entries({ dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {} })) {
  for (const [name, version] of Object.entries(deps)) {
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(version))) fail(`${group}.${name} is not pinned exactly (${version})`);
  }
}

const requiredBuildDependencies = {
  vite: '8.2.2',
  '@vitejs/plugin-react': '6.1.0',
  typescript: '7.0.2',
};
for (const [name, expectedVersion] of Object.entries(requiredBuildDependencies)) {
  const actualVersion = pkg.devDependencies?.[name];
  if (actualVersion !== expectedVersion) fail(`required build dependency ${name} must be pinned to ${expectedVersion}, got ${actualVersion ?? 'missing'}`);
}

const lock = JSON.parse(readText('package-lock.json'));
const lockRoot = lock.packages?.[''];
if (!lockRoot) fail('package-lock.json is missing the root package entry');
for (const [name, expectedVersion] of Object.entries(requiredBuildDependencies)) {
  const lockedRootVersion = lockRoot.devDependencies?.[name];
  if (lockedRootVersion !== expectedVersion) fail(`package-lock root dependency ${name} must be ${expectedVersion}, got ${lockedRootVersion ?? 'missing'}`);
  const installed = lock.packages?.[`node_modules/${name}`]?.version;
  if (installed !== expectedVersion) fail(`package-lock installed dependency ${name} must resolve to ${expectedVersion}, got ${installed ?? 'missing'}`);
}

const viteConfig = readText('vite.config.ts');
if (!viteConfig.includes("from '@vitejs/plugin-react'")) fail('Vite config must import @vitejs/plugin-react');
if (!/plugins\s*:\s*\[\s*react\(\)\s*\]/.test(viteConfig)) fail('Vite config must enable the React plugin');
if (!/base\s*:\s*['"]\.\/['"]/.test(viteConfig)) fail('Vite config must keep relative base ./ for Capacitor packaging');

const capacitor = JSON.parse(readText('capacitor.config.json'));
if (capacitor.appId !== 'com.fitcoach.next') fail(`unexpected bundle id ${capacitor.appId}`);
if (capacitor.appName !== 'FitCoach Next') fail(`unexpected app name ${capacitor.appName}`);
if (capacitor.webDir !== 'dist') fail(`unexpected webDir ${capacitor.webDir}`);

const metadata = JSON.parse(readText('release-metadata.json'));
if (metadata.productName !== capacitor.appName) fail('release metadata product name does not match Capacitor app name');
if (metadata.bundleId !== capacitor.appId) fail('release metadata bundle id does not match Capacitor app id');
if (metadata.version !== pkg.version) fail(`release metadata version ${metadata.version} does not match package version ${pkg.version}`);
if (metadata.releaseChannel !== 'rc') fail(`unexpected release channel ${metadata.releaseChannel}`);
if (metadata.primaryLocale !== 'es-ES') fail(`unexpected primary locale ${metadata.primaryLocale}`);
if (metadata.category !== 'Health & Fitness') fail(`unexpected App Store category ${metadata.category}`);
if (!Array.isArray(metadata.platforms) || metadata.platforms.length !== 1 || metadata.platforms[0] !== 'iPhone') fail('release target must be iPhone-only for this RC');
if (metadata.orientation !== 'portrait') fail(`unexpected orientation policy ${metadata.orientation}`);
if (metadata.dataStorage !== 'local-first') fail(`unexpected data storage policy ${metadata.dataStorage}`);
if (metadata.tracking !== false) fail('release metadata must explicitly disable tracking');
if (metadata.remoteAnalytics !== false) fail('remote analytics must remain disabled for this RC');
if (metadata.progressPhotosRemoteByDefault !== false) fail('progress photos must not be remote by default');
for (const [key, value] of Object.entries({ privacyPolicyUrl: metadata.privacyPolicyUrl, supportUrl: metadata.supportUrl })) {
  let url;
  try { url = new URL(value); } catch { fail(`${key} is not a valid URL`); }
  if (url.protocol !== 'https:') fail(`${key} must use HTTPS`);
  if (url.hostname !== 'agusgonbel-code.github.io') fail(`${key} must point to the approved public FitCoach site`);
}

const privacyUrl = new URL(metadata.privacyPolicyUrl);
const supportUrl = new URL(metadata.supportUrl);
if (privacyUrl.pathname !== '/Fitcoach.app/privacy.html') fail(`unexpected privacy policy path ${privacyUrl.pathname}`);
if (supportUrl.pathname !== '/Fitcoach.app/support.html') fail(`unexpected support path ${supportUrl.pathname}`);

const privacyPage = readText('../privacy.html');
if (!privacyPage.includes('FitCoach Next')) fail('public privacy policy does not mention FitCoach Next');
if (!privacyPage.includes('Borrar todos mis datos')) fail('public privacy policy does not document complete Next data deletion');
if (!privacyPage.includes('no realiza seguimiento')) fail('public privacy policy does not state the tracking policy');

const supportPage = readText('../support.html');
if (!supportPage.includes('FitCoach Next')) fail('public support page does not mention FitCoach Next');
if (!supportPage.includes('Perfil → Datos y privacidad')) fail('public support page does not document Next backup/privacy controls');
if (!supportPage.includes('https://github.com/agusgonbel-code/Fitcoach.app/issues/new')) fail('public support page is missing the support issue link');

const index = readText('index.html');
if (!index.includes('viewport-fit=cover')) fail('viewport does not include viewport-fit=cover');
if (!/<html\s+lang="es"/.test(index)) fail('document language is not Spanish');
if (!index.includes('<title>FitCoach Next</title>')) fail('document title is missing');

const privacy = readText('PrivacyInfo.xcprivacy');
if (!privacy.includes('NSPrivacyTracking')) fail('privacy manifest does not declare tracking state');
if (!privacy.includes('<false/>')) fail('privacy manifest does not explicitly disable tracking');

const png = read('assets/app-icon-1024.png');
if (png.length < 24 || png.toString('ascii', 1, 4) !== 'PNG') fail('app icon is not a valid PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== 1024 || height !== 1024) fail(`app icon must be 1024x1024, got ${width}x${height}`);

console.log(`FitCoach Next release audit OK · ${pkg.version} · ${metadata.releaseChannel} · ${capacitor.appId} · ${metadata.primaryLocale} · iPhone portrait · build toolchain locked · privacy/support aligned · icon ${width}x${height}`);
