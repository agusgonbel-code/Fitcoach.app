import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('la distribución nativa conserva identidad, privacidad y compilación verificable', () => {
  const config = JSON.parse(readFileSync(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const assets = readFileSync(new URL('../scripts/configure-ios-assets.mjs', import.meta.url), 'utf8');
  const sync = readFileSync(new URL('../scripts/sync-web.mjs', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/ios-native-ci.yml', import.meta.url), 'utf8');
  const manifest = readFileSync(new URL('../PrivacyInfo.xcprivacy', import.meta.url), 'utf8');
  const release = JSON.parse(readFileSync(new URL('../app-store/release.json', import.meta.url), 'utf8'));
  const version = JSON.parse(readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
  const privacy = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
  const support = readFileSync(new URL('../support.html', import.meta.url), 'utf8');

  assert.equal(config.appId, 'com.fitcoach.app');
  assert.equal(config.appName, 'FitCoach');
  assert.equal(config.webDir, 'www');
  assert.equal(release.bundleId, config.appId);
  assert.equal(release.marketingVersion, version.version);
  assert.equal(release.buildNumber, 1);
  assert.equal(pkg.dependencies['@capacitor/core'], '8.5.0');
  assert.equal(pkg.dependencies['@capacitor/ios'], '8.5.0');
  assert.equal(pkg.devDependencies['@capacitor/cli'], '8.5.0');
  assert.match(pkg.scripts['cap:add:ios'], /sync:web.*cap add ios.*ios:assets/);
  assert.match(pkg.scripts['ios:prepare'], /sync:web.*cap sync ios.*ios:assets/);

  for (const resource of ['privacy.html', 'support.html']) {
    assert.match(sync, new RegExp(resource.replace('.', '\\.')));
  }
  assert.match(assets, /icon-512\.png/);
  assert.match(assets, /'sips'/);
  assert.match(assets, /PrivacyInfo\.xcprivacy/);
  assert.match(assets, /PBXResourcesBuildPhase/);
  assert.match(assets, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(assets, /MARKETING_VERSION/);
  assert.match(assets, /CURRENT_PROJECT_VERSION/);
  assert.match(assets, /release\.marketingVersion/);
  assert.match(assets, /release\.buildNumber/);

  assert.match(manifest, /<key>NSPrivacyTracking<\/key>\s*<false\/>/);
  assert.match(manifest, /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array\/>/);
  assert.match(privacy, /No recopilamos datos personales/);
  assert.match(privacy, /IndexedDB/);
  assert.match(support, /Fitcoach\.app\/issues\/new/);

  assert.match(workflow, /runs-on: macos-26/);
  assert.match(workflow, /npx cap add ios/);
  assert.match(workflow, /generic\/platform=iOS Simulator/);
  assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(workflow, /com\.fitcoach\.app/);
  assert.match(workflow, /CFBundleShortVersionString/);
  assert.match(workflow, /CFBundleVersion/);
  assert.match(workflow, /EXPECTED_VERSION/);
  assert.match(workflow, /EXPECTED_BUILD/);
  assert.match(workflow, /plutil -lint/);
  assert.match(workflow, /NSPrivacyCollectedDataTypes/);
  assert.match(workflow, /FitCoach-iOS-Simulator/);
});
