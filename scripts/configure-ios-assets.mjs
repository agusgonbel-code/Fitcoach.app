import { execFile } from 'node:child_process';
import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const root = path.resolve(import.meta.dirname, '..');
const iconSource = path.join(root, 'icon-512.png');
const iconDestination = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
const privacySource = path.join(root, 'PrivacyInfo.xcprivacy');
const versionPath = path.join(root, 'version.json');
const releasePath = path.join(root, 'app-store', 'release.json');
const privacyDestination = path.join(root, 'ios', 'App', 'App', 'PrivacyInfo.xcprivacy');
const projectPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

for (const file of [iconSource, privacySource]) {
  await stat(file).catch(() => { throw new Error(`Falta el recurso nativo ${path.basename(file)}.`); });
}
for (const file of [iconDestination, projectPath]) {
  await stat(file).catch(() => { throw new Error('No existe el proyecto iOS. Ejecuta primero `npm run cap:add:ios`.'); });
}

await promisify(execFile)('sips', ['-z', '1024', '1024', iconSource, '--out', iconDestination]);
await copyFile(privacySource, privacyDestination);

const appVersion = JSON.parse(await readFile(versionPath, 'utf8')).version;
const release = JSON.parse(await readFile(releasePath, 'utf8'));
if (release.bundleId !== 'com.fitcoach.app') throw new Error('El bundleId de distribución no coincide con FitCoach.');
if (release.marketingVersion !== appVersion) throw new Error('La versión nativa no coincide con version.json.');
if (!Number.isInteger(release.buildNumber) || release.buildNumber < 1) throw new Error('El número de compilación debe ser un entero positivo.');

let project = await readFile(projectPath, 'utf8');
const fileRef = 'F17C00010000000000000001';
const buildRef = 'F17C00010000000000000002';
const buildLine = `\t\t${buildRef} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRef} /* PrivacyInfo.xcprivacy */; };\n`;
const fileLine = `\t\t${fileRef} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n`;
const groupLine = `\t\t\t\t${fileRef} /* PrivacyInfo.xcprivacy */,\n`;
const resourceLine = `\t\t\t\t${buildRef} /* PrivacyInfo.xcprivacy in Resources */,\n`;

const addAfter = (source, anchor, addition, description) => {
  if (source.includes(addition.trim())) return source;
  if (!source.includes(anchor)) throw new Error(`No se encontró ${description} en el proyecto Xcode.`);
  return source.replace(anchor, anchor + addition);
};

project = addAfter(project, '/* Begin PBXBuildFile section */\n', buildLine, 'PBXBuildFile');
project = addAfter(project, '/* Begin PBXFileReference section */\n', fileLine, 'PBXFileReference');
if (!project.includes(groupLine.trim())) {
  const appGroup = /(\/\* App \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n)/;
  if (!appGroup.test(project)) throw new Error('No se encontró el grupo App en el proyecto Xcode.');
  project = project.replace(appGroup, `$1${groupLine}`);
}
if (!project.includes(resourceLine.trim())) {
  const resources = /(\/\* Resources \*\/ = \{\n\t\t\tisa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = \(\n)/;
  if (!resources.test(project)) throw new Error('No se encontró la fase Resources en el proyecto Xcode.');
  project = project.replace(resources, `$1${resourceLine}`);
}
const replaceBuildSetting = (source, name, value) => {
  const pattern = new RegExp(`(${name} = )[^;]+;`, 'g');
  const matches = source.match(pattern) ?? [];
  if (!matches.length) throw new Error(`No se encontró ${name} en el proyecto Xcode.`);
  return source.replace(pattern, (_, prefix) => `${prefix}${value};`);
};
project = replaceBuildSetting(project, 'MARKETING_VERSION', release.marketingVersion);
project = replaceBuildSetting(project, 'CURRENT_PROJECT_VERSION', String(release.buildNumber));

await writeFile(projectPath, project, 'utf8');
console.log(`FitCoach ${release.marketingVersion} (${release.buildNumber}): icono y privacidad instalados en iOS.`);
