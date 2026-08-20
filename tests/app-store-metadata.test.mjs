import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('los metadatos españoles cumplen los límites de App Store', () => {
  const metadata = readJson('../app-store/metadata.es-ES.json');
  const release = readJson('../app-store/release.json');
  const version = readJson('../version.json');
  const capacitor = readJson('../capacitor.config.json');

  assert.equal(metadata.locale, 'es-ES');
  assert.ok(metadata.name.length > 0 && metadata.name.length <= 30);
  assert.ok(metadata.subtitle.length > 0 && metadata.subtitle.length <= 30);
  assert.ok(metadata.promotionalText.length > 0 && metadata.promotionalText.length <= 170);
  assert.ok(metadata.description.length > 0 && metadata.description.length <= 4000);
  assert.ok(metadata.keywords.length > 0 && metadata.keywords.length <= 100);
  assert.match(metadata.privacyUrl, /^https:\/\//);
  assert.match(metadata.supportUrl, /^https:\/\//);
  assert.doesNotMatch(JSON.stringify(metadata), /TODO|TBD|placeholder/i);

  assert.equal(release.bundleId, capacitor.appId);
  assert.equal(release.marketingVersion, version.version);
  assert.ok(Number.isInteger(release.buildNumber) && release.buildNumber > 0);
  assert.match(release.minimumIos, /^\d+\.\d+$/);
});

test('el plan de capturas cubre las funciones principales sin datos personales', () => {
  const screenshots = readJson('../app-store/screenshots.es-ES.json');
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  assert.equal(screenshots.locale, 'es-ES');
  assert.equal(screenshots.platform, 'IPHONE');
  assert.equal(screenshots.orientation, 'PORTRAIT');
  assert.equal(screenshots.minimumRequired, 1);
  assert.equal(screenshots.maximumAllowed, 10);
  assert.ok(screenshots.scenes.length >= screenshots.minimumRequired);
  assert.ok(screenshots.scenes.length <= screenshots.maximumAllowed);
  assert.deepEqual(screenshots.scenes.map(scene => scene.order), [1, 2, 3, 4, 5]);
  assert.equal(new Set(screenshots.scenes.map(scene => scene.id)).size, screenshots.scenes.length);

  for (const scene of screenshots.scenes) {
    assert.ok(scene.headline.length > 0 && scene.headline.length <= 40);
    assert.ok(scene.supportingText.length > 0 && scene.supportingText.length <= 70);
    assert.ok(scene.setup.length > 0);
    assert.match(index, new RegExp(`id="${scene.surface}"`));
  }

  assert.ok(screenshots.privacyRules.some(rule => /datos ficticios/i.test(rule)));
  assert.ok(screenshots.privacyRules.some(rule => /fotografías.*persona real/i.test(rule)));
});
