import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('la distribución nativa conserva identidad, icono y compilación verificable', () => {
  const config = JSON.parse(readFileSync(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const assets = readFileSync(new URL('../scripts/configure-ios-assets.mjs', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/ios-native-ci.yml', import.meta.url), 'utf8');

  assert.equal(config.appId, 'com.fitcoach.app');
  assert.equal(config.appName, 'FitCoach');
  assert.equal(config.webDir, 'www');
  assert.equal(pkg.dependencies['@capacitor/core'], '8.5.0');
  assert.equal(pkg.dependencies['@capacitor/ios'], '8.5.0');
  assert.equal(pkg.devDependencies['@capacitor/cli'], '8.5.0');
  assert.match(pkg.scripts['cap:add:ios'], /sync:web.*cap add ios.*ios:assets/);
  assert.match(pkg.scripts['ios:prepare'], /sync:web.*cap sync ios.*ios:assets/);
  assert.equal(pkg.scripts['ios:assets'], 'node scripts/configure-ios-assets.mjs');

  assert.match(assets, /icon-512\.png/);
  assert.match(assets, /'sips'/);
  assert.match(assets, /'1024'/);
  assert.match(assets, /AppIcon-512@2x\.png/);

  assert.match(workflow, /runs-on: macos-26/);
  assert.match(workflow, /npx cap add ios/);
  assert.match(workflow, /npm run ios:assets/);
  assert.match(workflow, /generic\/platform=iOS Simulator/);
  assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(workflow, /com\.fitcoach\.app/);
  assert.match(workflow, /FitCoach-iOS-Simulator/);
});
