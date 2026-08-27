import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const marketingVersion = String(packageJson.version || '').replace(/-.*$/, '');
const buildNumber = process.env.FITCOACH_BUILD_NUMBER || '1';
if (!/^\d+\.\d+\.\d+$/.test(marketingVersion)) throw new Error(`Versión App Store inválida: ${marketingVersion}`);
if (!/^\d+$/.test(buildNumber) || Number(buildNumber) < 1) throw new Error(`Build iOS inválido: ${buildNumber}`);

const projectPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const iconSource = path.join(root, 'assets', 'app-icon-1024.png');
const iconDestination = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
for (const file of [projectPath, iconSource, iconDestination]) {
  await stat(file).catch(() => { throw new Error(`Falta ${path.relative(root, file)}. Ejecuta primero npm run cap:add:ios.`); });
}

await copyFile(iconSource, iconDestination);
let project = await readFile(projectPath, 'utf8');
const replaceSetting = (source, key, value) => {
  const pattern = new RegExp(`${key} = [^;]+;`, 'g');
  if (!pattern.test(source)) throw new Error(`No se encontró ${key} en project.pbxproj.`);
  return source.replace(pattern, `${key} = ${value};`);
};
project = replaceSetting(project, 'MARKETING_VERSION', marketingVersion);
project = replaceSetting(project, 'CURRENT_PROJECT_VERSION', buildNumber);
project = replaceSetting(project, 'PRODUCT_BUNDLE_IDENTIFIER', 'com.fitcoach.next');
await writeFile(projectPath, project, 'utf8');
console.log(`FitCoach Next iOS preparado: ${marketingVersion} (${buildNumber}), icono 1024 px instalado.`);
