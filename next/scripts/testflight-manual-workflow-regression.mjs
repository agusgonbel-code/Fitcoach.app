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
requireMatch('explicit upload input', /upload_to_testflight:\s*\n\s*description:/);
requireMatch('upload defaults disabled', /upload_to_testflight:[\s\S]*?default:\s*false/);
requireMatch('upload input is boolean', /upload_to_testflight:[\s\S]*?type:\s*boolean/);
requireMatch('development branch runtime guard', /if:\s*github\.ref_name == 'fitcoach-next'/);
requireMatch('immutable candidate checkout', /ref:\s*\$\{\{ github\.sha \}\}/);
requireMatch('immutable candidate verification step', /- name:\s*Verify immutable candidate identity/);
requireMatch('candidate HEAD matches event SHA', /test "\$ACTUAL_SHA" = "\$GITHUB_SHA"/);
requireMatch('candidate branch identity verified', /test "\$GITHUB_REF_NAME" = 'fitcoach-next'/);
requireMatch('credentials not persisted', /persist-credentials:\s*false/);
requireMatch('protected TestFlight environment', /environment:\s*fitcoach-next-testflight/);
requireMatch('read-only repository permission', /permissions:\s*\n\s*contents:\s*read/);
requireMatch('pinned macOS runner', /runs-on:\s*macos-26/);
requireMatch('locked dependency install', /npm ci --no-audit --no-fund/);
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
requireMatch('isolated native project generation', /run:\s*npx cap add ios/);
requireMatch('native release preparation', /run:\s*npm run ios:prepare/);
requireMatch('temporary signing keychain', /security create-keychain/);
requireMatch('distribution certificate import', /security import/);
requireMatch('Apple Distribution identity', /Apple Distribution/);
requireMatch('profile payload decoded', /security cms -D -i/);
requireMatch('profile team validation', /test "\$PROFILE_TEAM" = "\$APPLE_TEAM_ID"/);
requireMatch('profile bundle validation', /test "\$APP_IDENTIFIER" = "\$APPLE_TEAM_ID\.com\.fitcoach\.next"/);
requireMatch('manual signing archive', /CODE_SIGN_STYLE=Manual/);
requireMatch('explicit provisioning profile', /PROVISIONING_PROFILE_SPECIFIER=/);
requireMatch('signed physical archive', /FitCoach-Next-Signed\.xcarchive/);
requireMatch('App Store Connect export method', /<string>app-store-connect<\/string>/);
requireMatch('IPA export', /xcodebuild -exportArchive/);
requireMatch('signed IPA existence', /FitCoach-Next\.ipa/);
requireMatch('signed IPA bundle validation', /test "\$BUNDLE_ID" = 'com\.fitcoach\.next'/);
requireMatch('signed IPA version validation', /test "\$VERSION" = "\$EXPECTED_VERSION"/);
requireMatch('signed IPA build validation', /test "\$BUILD" = "\$FITCOACH_BUILD_NUMBER"/);
requireMatch('physical architecture validation', /grep -qx 'arm64'/);
requireMatch('simulator architecture rejection', /x86_64\|i386/);
requireMatch('embedded provisioning profile', /embedded\.mobileprovision/);
requireMatch('privacy manifest validation', /PrivacyInfo\.xcprivacy/);
requireMatch('web bundle validation', /public\/index\.html/);
requireMatch('code signature verification', /codesign --verify --deep --strict/);
requireMatch('team signature verification', /TeamIdentifier=\$APPLE_TEAM_ID/);
requireMatch('upload step exists', /- name:\s*Upload validated IPA to TestFlight/);
requireMatch('upload requires explicit consent', /Upload validated IPA to TestFlight[\s\S]*?if:\s*\$\{\{ inputs\.upload_to_testflight \}\}/);
requireMatch('private API key isolated', /PRIVATE_KEYS_DIR="\$RUNNER_TEMP\/appstoreconnect-private-keys"/);
requireMatch('private API key restrictive permissions', /chmod 600 "\$KEY_PATH"/);
requireMatch('Apple upload command', /xcrun altool --upload-app/);
requireMatch('upload exact IPA', /--file "\$RUNNER_TEMP\/FitCoach-Next\.ipa"/);
requireMatch('upload API key', /--apiKey "\$APP_STORE_CONNECT_KEY_ID"/);
requireMatch('upload API issuer', /--apiIssuer "\$APP_STORE_CONNECT_ISSUER_ID"/);
requireMatch('candidate checksum generation', /shasum -a 256 testflight-candidate\/FitCoach-Next\.ipa/);
requireMatch('candidate checksum verification', /shasum -a 256 -c testflight-candidate\/SHA256SUMS\.txt/);
requireMatch('commit evidence pinning', /commit=\$\{GITHUB_SHA\}/);
requireMatch('ref evidence pinning', /ref=\$\{GITHUB_REF_NAME\}/);
requireMatch('candidate identity evidence', /candidate_identity=verified/);
requireMatch('bundle evidence', /bundle_id=com\.fitcoach\.next/);
requireMatch('manual distribution marker', /distribution_gate=manual/);
requireMatch('signed archive marker', /signed_archive=passed/);
requireMatch('signed IPA marker', /signed_ipa=passed/);
requireMatch('upload request evidence', /upload_requested=\$\{UPLOAD_TO_TESTFLIGHT\}/);
requireMatch('upload result evidence', /upload_performed=\$\{UPLOAD_TO_TESTFLIGHT\}/);
requireMatch('commit-bound candidate artifact', /FitCoach-Next-TestFlight-Candidate-\$\{\{ github\.sha \}\}/);
requireMatch('artifact must exist', /if-no-files-found:\s*error/);
requireMatch('evidence retention window', /retention-days:\s*14/);

requireAbsent('push trigger', /\n\s*push:/);
requireAbsent('pull request trigger', /\n\s*pull_request:/);
requireAbsent('moving branch checkout', /ref:\s*fitcoach-next\b/);
requireAbsent('production branch reference', /ref:\s*(?:main|master)\b/);
requireAbsent('unconditional TestFlight upload', /- name:\s*Upload validated IPA to TestFlight\s*\n(?!\s*if:)/);
requireAbsent('write repository permission', /contents:\s*write/);
requireAbsent('automatic provisioning', /allowProvisioningUpdates|CODE_SIGN_STYLE\s*=\s*Automatic/);

console.log('FitCoach Next immutable TestFlight candidate regression suite OK');
