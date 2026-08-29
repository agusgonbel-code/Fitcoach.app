import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflowUrl = new URL('../../.github/workflows/fitcoach-next-ios-ci.yml', import.meta.url);
const workflow = fs.readFileSync(workflowUrl, 'utf8');

function requireMatch(name, pattern) {
  assert.match(workflow, pattern, `${name}: required iOS RC workflow contract is missing`);
}

function requireAbsent(name, pattern) {
  assert.doesNotMatch(workflow, pattern, `${name}: forbidden iOS RC workflow behavior detected`);
}

requireMatch('isolated development branch trigger', /branches:\s*\[fitcoach-next\]/);
requireMatch('release simulator build', /configuration Release[\s\S]*generic\/platform=iOS Simulator/);
requireMatch('physical iPhone build', /generic\/platform=iOS[\s\S]*CODE_SIGNING_ALLOWED=NO/);
requireMatch('unsigned archive creation', /archivePath[\s\S]*FitCoach-Next\.xcarchive[\s\S]*CODE_SIGNING_ALLOWED=NO/);
requireMatch('arm64 archive validation', /lipo -archs[\s\S]*grep -qx 'arm64'/);
requireMatch('simulator architecture rejection', /Simulator architecture found in archive binary/);
requireMatch('release identity validation', /test "\$BUNDLE_ID" = 'com\.fitcoach\.next'/);
requireMatch('privacy manifest validation', /PrivacyInfo\.xcprivacy/);
requireMatch('web bundle validation', /public\/index\.html/);
requireMatch('archive checksum generation', /shasum -a 256[\s\S]*SHA256SUMS\.txt/);
requireMatch('archive checksum verification', /shasum -a 256 -c rc-artifact\/SHA256SUMS\.txt/);
requireMatch('RC evidence commit pinning', /commit=\$\{GITHUB_SHA\}/);
requireMatch('RC evidence unsigned marker', /signing=unsigned/);
requireMatch('validated archive artifact upload', /FitCoach-Next-iPhone-RC-Archive-\$\{\{ github\.sha \}\}/);
requireMatch('artifact upload must fail when missing', /if-no-files-found: error/);

requireAbsent('production branch push trigger', /push:[\s\S]{0,120}branches:\s*\[(?:main|master)\]/);
requireAbsent('automatic App Store upload', /altool|notarytool|xcrun\s+transporter|upload-app|deliver\b|pilot\b/i);
requireAbsent('automatic signing in RC validation', /CODE_SIGN_STYLE\s*=\s*Automatic|allowProvisioningUpdates/);

console.log('FitCoach Next iOS RC workflow regression suite OK');
