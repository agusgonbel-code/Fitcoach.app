import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const metadataPath = new URL('../release-metadata.json', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);
const originalMetadata = fs.readFileSync(metadataPath, 'utf8');
const originalPackage = fs.readFileSync(packagePath, 'utf8');

function runAudit() {
  return spawnSync(process.execPath, ['scripts/release-audit.mjs'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
}

function expectRejected(name, mutate, expectedMessage) {
  try {
    const metadata = JSON.parse(originalMetadata);
    const pkg = JSON.parse(originalPackage);
    mutate({ metadata, pkg });
    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

    const result = runAudit();
    assert.notEqual(result.status, 0, `${name}: release audit unexpectedly passed`);
    const output = `${result.stderr}\n${result.stdout}`;
    assert.match(output, expectedMessage, `${name}: unexpected audit failure: ${output}`);
  } finally {
    fs.writeFileSync(metadataPath, originalMetadata);
    fs.writeFileSync(packagePath, originalPackage);
  }
}

const baseline = runAudit();
assert.equal(baseline.status, 0, `baseline release audit failed:\n${baseline.stderr}\n${baseline.stdout}`);

expectRejected(
  'version drift',
  ({ metadata }) => { metadata.version = '0.2.0-rc.99'; },
  /release metadata version .* does not match package version/,
);

expectRejected(
  'wrong release channel',
  ({ metadata }) => { metadata.releaseChannel = 'beta'; },
  /unexpected release channel beta/,
);

expectRejected(
  'iPad accidentally enabled',
  ({ metadata }) => { metadata.platforms = ['iPhone', 'iPad']; },
  /release target must be iPhone-only/,
);

expectRejected(
  'non-RC package version',
  ({ pkg, metadata }) => { pkg.version = '0.2.0'; metadata.version = '0.2.0'; },
  /is not an RC semantic version/,
);

expectRejected(
  'unapproved support host',
  ({ metadata }) => { metadata.supportUrl = 'https://example.com/support'; },
  /supportUrl must point to the approved public FitCoach site/,
);

console.log('FitCoach Next release audit regression suite OK');
