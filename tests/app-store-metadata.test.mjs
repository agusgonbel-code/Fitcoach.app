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
