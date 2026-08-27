import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const fail = message => { throw new Error(`iOS native audit failed: ${message}`); };

const infoPath = 'ios/App/App/Info.plist';
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const [info, project] = await Promise.all([read(infoPath), read(projectPath)]);

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

if (!/PRODUCT_BUNDLE_IDENTIFIER = com\.fitcoach\.next;/.test(project)) fail('bundle id is not com.fitcoach.next');
if (!/TARGETED_DEVICE_FAMILY = 1;/.test(project)) fail('target is not iPhone-only');

console.log('FitCoach Next iOS native audit OK · no unnecessary permissions, entitlements or relaxed transport security.');
