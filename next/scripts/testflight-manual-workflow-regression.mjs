import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflowUrl = new URL('../../.github/workflows/fitcoach-next-testflight-manual.yml', import.meta.url);
const workflow = fs.readFileSync(workflowUrl, 'utf8');

function requireMatch(name, pattern) {
  assert.match(workflow, pattern, `${name}: required manual TestFlight workflow contract is missing`);
}

function requireAbsent(name, pattern) {
  assert.doesNotMatch(workflow, pattern, `${name}: forbidden manual TestFlight workflow behavior detected`);
}

requireMatch('manual dispatch only', /on:\s*\n\s*workflow_dispatch:/);
requireMatch('development branch runtime guard', /if:\s*github\.ref_name == 'fitcoach-next'/);
requireMatch('exact development checkout', /ref:\s*fitcoach-next/);
requireMatch('credentials not persisted', /persist-credentials:\s*false/);
requireMatch('protected TestFlight environment', /environment:\s*fitcoach-next-testflight/);
requireMatch('read-only repository permission', /permissions:\s*\n\s*contents:\s*read/);
requireMatch('locked dependency install', /run:\s*npm ci/);
requireMatch('release contract regressions', /run:\s*npm run test:release/);
requireMatch('signed preflight', /run:\s*npm run release:testflight:preflight:signed/);
requireMatch('Apple team secret', /APPLE_TEAM_ID:\s*\$\{\{ secrets\.APPLE_TEAM_ID \}\}/);
requireMatch('App Store Connect key secret', /APP_STORE_CONNECT_KEY_ID:\s*\$\{\{ secrets\.APP_STORE_CONNECT_KEY_ID \}\}/);
requireMatch('App Store Connect issuer secret', /APP_STORE_CONNECT_ISSUER_ID:\s*\$\{\{ secrets\.APP_STORE_CONNECT_ISSUER_ID \}\}/);
requireMatch('App Store Connect private key secret', /APP_STORE_CONNECT_PRIVATE_KEY:\s*\$\{\{ secrets\.APP_STORE_CONNECT_PRIVATE_KEY \}\}/);
requireMatch('distribution certificate secret', /IOS_DISTRIBUTION_CERTIFICATE_P12:\s*\$\{\{ secrets\.IOS_DISTRIBUTION_CERTIFICATE_P12 \}\}/);
requireMatch('distribution certificate password secret', /IOS_DISTRIBUTION_CERTIFICATE_PASSWORD:\s*\$\{\{ secrets\.IOS_DISTRIBUTION_CERTIFICATE_PASSWORD \}\}/);
requireMatch('provisioning profile secret', /IOS_PROVISIONING_PROFILE:\s*\$\{\{ secrets\.IOS_PROVISIONING_PROFILE \}\}/);
requireMatch('signing material hard gate', /Missing required distribution signing input/);
requireMatch('native release preparation', /run:\s*npm run ios:prepare/);
requireMatch('commit evidence pinning', /commit=\$\{GITHUB_SHA\}/);
requireMatch('ref evidence pinning', /ref=\$\{GITHUB_REF_NAME\}/);
requireMatch('bundle evidence', /bundle_id=com\.fitcoach\.next/);
requireMatch('manual distribution marker', /distribution_gate=manual/);
requireMatch('no upload evidence marker', /upload_performed=false/);
requireMatch('commit-bound evidence artifact', /FitCoach-Next-TestFlight-Preflight-\$\{\{ github\.sha \}\}/);
requireMatch('artifact must exist', /if-no-files-found:\s*error/);
requireMatch('evidence retention window', /retention-days:\s*14/);

requireAbsent('push trigger', /\n\s*push:/);
requireAbsent('pull request trigger', /\n\s*pull_request:/);
requireAbsent('production branch reference', /ref:\s*(?:main|master)\b/);
requireAbsent('automatic App Store upload', /altool|notarytool|xcrun\s+transporter|upload-app|deliver\b|pilot\b/i);
requireAbsent('write repository permission', /contents:\s*write/);
requireAbsent('automatic provisioning', /allowProvisioningUpdates|CODE_SIGN_STYLE\s*=\s*Automatic/);

console.log('FitCoach Next manual TestFlight workflow regression suite OK');
