import { readFileSync } from 'node:fs';
import process from 'node:process';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const metadata = JSON.parse(readFileSync(new URL('../release-metadata.json', import.meta.url), 'utf8'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const signedMode = process.argv.includes('--signed');

assert(metadata.productName === 'FitCoach Next', 'Unexpected product name');
assert(metadata.bundleId === 'com.fitcoach.next', 'Unexpected TestFlight bundle identifier');
assert(metadata.version === pkg.version, 'release-metadata version must match package.json');
assert(metadata.releaseChannel === 'rc', 'TestFlight preflight only accepts the rc channel');
assert(/^\d+\.\d+\.\d+-rc\.\d+$/.test(pkg.version), 'Package version must be an RC SemVer');
assert(Array.isArray(metadata.platforms) && metadata.platforms.length === 1 && metadata.platforms[0] === 'iPhone', 'RC must target iPhone only');
assert(metadata.orientation === 'portrait', 'RC must remain portrait-only');
assert(metadata.tracking === false, 'Tracking must remain disabled for this RC');
assert(metadata.remoteAnalytics === false, 'Remote analytics must remain disabled for this RC');
assert(metadata.progressPhotosRemoteByDefault === false, 'Progress photos must remain local by default');
assert(typeof metadata.privacyPolicyUrl === 'string' && metadata.privacyPolicyUrl.startsWith('https://'), 'Privacy policy URL must be HTTPS');
assert(typeof metadata.supportUrl === 'string' && metadata.supportUrl.startsWith('https://'), 'Support URL must be HTTPS');

const signingInputs = {
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  APP_STORE_CONNECT_KEY_ID: process.env.APP_STORE_CONNECT_KEY_ID,
  APP_STORE_CONNECT_ISSUER_ID: process.env.APP_STORE_CONNECT_ISSUER_ID,
  APP_STORE_CONNECT_PRIVATE_KEY: process.env.APP_STORE_CONNECT_PRIVATE_KEY,
};

if (signedMode) {
  for (const [name, value] of Object.entries(signingInputs)) {
    assert(typeof value === 'string' && value.trim().length > 0, `Missing required signing input: ${name}`);
  }
}

if (failures.length > 0) {
  console.error('FitCoach Next TestFlight preflight failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const result = {
  productName: metadata.productName,
  bundleId: metadata.bundleId,
  version: metadata.version,
  releaseChannel: metadata.releaseChannel,
  platform: metadata.platforms[0],
  signedMode,
  signingInputsPresent: Object.fromEntries(
    Object.entries(signingInputs).map(([name, value]) => [name, Boolean(value?.trim())]),
  ),
};

console.log(`FitCoach Next TestFlight preflight passed (${signedMode ? 'signed' : 'unsigned'} mode).`);
console.log(JSON.stringify(result, null, 2));
