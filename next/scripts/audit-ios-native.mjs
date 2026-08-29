import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const fail = message => { throw new Error(`iOS native audit failed: ${message}`); };

const infoPath = 'ios/App/App/Info.plist';
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const [info, project, packageText, capacitorText, metadataText] = await Promise.all([
  read(infoPath),
  read(projectPath),
  read('package.json'),
  read('capacitor.config.json'),
  read('release-metadata.json'),
]);

const pkg = JSON.parse(packageText);
const capacitor = JSON.parse(capacitorText);
const metadata = JSON.parse(metadataText);
const marketingVersion = String(pkg.version || '').replace(/-.*$/, '');
const expectedBuildNumber = process.env.FITCOACH_BUILD_NUMBER;

if (!/^\d+\.\d+\.\d+$/.test(marketingVersion)) fail(`invalid marketing version ${marketingVersion}`);
if (capacitor.appId !== metadata.bundleId) fail('Capacitor and release metadata bundle ids differ');
if (capacitor.appName !== metadata.productName) fail('Capacitor and release metadata product names differ');
if (expectedBuildNumber !== undefined && (!/^\d+$/.test(expectedBuildNumber) || Number(expectedBuildNumber) < 1)) fail(`invalid FITCOACH_BUILD_NUMBER ${expectedBuildNumber}`);

const requiredInfoFragments = [
  '<key>CFBundleDisplayName</key>',
  '<string>FitCoach Next</string>',
  '<key>UISupportedInterfaceOrientations</key>',
  '<string>UIInterfaceOrientationPortrait</string>',
];
for (const fragment of requiredInfoFragments) {
  if (!info.includes(fragment)) fail(`missing required Info.plist fragment: ${fragment}`);
}

const forbiddenUsageDescriptionKeys = [
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSLocationAlwaysUsageDescription',
  'NSContactsUsageDescription',
  'NSCalendarsUsageDescription',
  'NSRemindersUsageDescription',
  'NSMotionUsageDescription',
  'NSBluetoothAlwaysUsageDescription',
  'NSBluetoothPeripheralUsageDescription',
  'NSSpeechRecognitionUsageDescription',
  'NSFaceIDUsageDescription',
  'NSHealthShareUsageDescription',
  'NSHealthUpdateUsageDescription',
  'NSLocalNetworkUsageDescription',
];
for (const key of forbiddenUsageDescriptionKeys) {
  if (info.includes(`<key>${key}</key>`)) fail(`unexpected permission declaration ${key}`);
}

const unsafeTransportPatterns = [
  /<key>NSAllowsArbitraryLoads<\/key>\s*<true\s*\/>/,
  /<key>NSAllowsArbitraryLoadsInWebContent<\/key>\s*<true\s*\/>/,
  /<key>NSAllowsLocalNetworking<\/key>\s*<true\s*\/>/,
];
for (const pattern of unsafeTransportPatterns) {
  if (pattern.test(info)) fail('App Transport Security is relaxed in the release project');
}

const forbiddenProjectCapabilities = [
  'aps-environment',
  'com.apple.developer.healthkit',
  'com.apple.developer.homekit',
  'com.apple.developer.networking.networkextension',
  'com.apple.developer.networking.vpn.api',
  'com.apple.developer.siri',
  'com.apple.developer.usernotifications',
  'SystemCapabilities = {',
  'CODE_SIGN_ENTITLEMENTS =',
];
for (const token of forbiddenProjectCapabilities) {
  if (project.includes(token)) fail(`unexpected native capability or entitlement: ${token}`);
}

const collectSettingValues = key => [...project.matchAll(new RegExp(`${key} = ([^;]+);`, 'g'))].map(match => match[1].trim());
const requireUniformSetting = (key, expected) => {
  const values = collectSettingValues(key);
  if (!values.length) fail(`missing ${key}`);
  const unique = [...new Set(values)];
  if (unique.length !== 1 || unique[0] !== expected) fail(`${key} is inconsistent: ${unique.join(', ')}`);
};

requireUniformSetting('PRODUCT_BUNDLE_IDENTIFIER', metadata.bundleId);
requireUniformSetting('TARGETED_DEVICE_FAMILY', '1');
requireUniformSetting('MARKETING_VERSION', marketingVersion);
if (expectedBuildNumber !== undefined) requireUniformSetting('CURRENT_PROJECT_VERSION', expectedBuildNumber);

const orientationBlock = info.match(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/);
if (!orientationBlock) fail('missing iPhone orientation array');
const orientations = [...orientationBlock[1].matchAll(/<string>([^<]+)<\/string>/g)].map(match => match[1]);
if (orientations.length !== 1 || orientations[0] !== 'UIInterfaceOrientationPortrait') fail(`unexpected iPhone orientations: ${orientations.join(', ')}`);

console.log(`FitCoach Next iOS native audit OK · ${metadata.bundleId} · ${marketingVersion}${expectedBuildNumber ? ` (${expectedBuildNumber})` : ''} · iPhone portrait · no unnecessary permissions, entitlements or relaxed transport security.`);
