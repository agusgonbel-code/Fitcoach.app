import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const metadataUrl = new URL('../release-metadata.json', import.meta.url);
const originalMetadataText = readFileSync(metadataUrl, 'utf8');
const originalMetadata = JSON.parse(originalMetadataText);
const scriptUrl = new URL('./testflight-preflight.mjs', import.meta.url);

const cleanSigningEnv = () => {
  const env = { ...process.env };
  delete env.APPLE_TEAM_ID;
  delete env.APP_STORE_CONNECT_KEY_ID;
  delete env.APP_STORE_CONNECT_ISSUER_ID;
  delete env.APP_STORE_CONNECT_PRIVATE_KEY;
  return env;
};

const run = (args = [], env = cleanSigningEnv()) => spawnSync(
  process.execPath,
  [scriptUrl.pathname, ...args],
  { encoding: 'utf8', env },
);

const expectSuccess = (result, label) => {
  if (result.status !== 0) {
    throw new Error(`${label} should pass, got ${result.status}\n${result.stderr}`);
  }
};

const expectFailure = (result, expectedText, label) => {
  if (result.status === 0) throw new Error(`${label} should fail`);
  const output = `${result.stdout}\n${result.stderr}`;
  if (!output.includes(expectedText)) {
    throw new Error(`${label} failed without expected message: ${expectedText}\n${output}`);
  }
};

try {
  expectSuccess(run(), 'Unsigned TestFlight preflight');

  expectFailure(
    run(['--signed']),
    'Missing required signing input: APPLE_TEAM_ID',
    'Signed preflight without credentials',
  );

  const signedEnv = {
    ...cleanSigningEnv(),
    APPLE_TEAM_ID: 'TESTTEAM01',
    APP_STORE_CONNECT_KEY_ID: 'TESTKEY01',
    APP_STORE_CONNECT_ISSUER_ID: '00000000-0000-0000-0000-000000000000',
    APP_STORE_CONNECT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
  };
  expectSuccess(run(['--signed'], signedEnv), 'Signed preflight with complete inputs');

  writeFileSync(metadataUrl, `${JSON.stringify({ ...originalMetadata, releaseChannel: 'production' }, null, 2)}\n`);
  expectFailure(
    run(),
    'TestFlight preflight only accepts the rc channel',
    'Production channel regression',
  );

  writeFileSync(metadataUrl, `${JSON.stringify({ ...originalMetadata, bundleId: 'com.fitcoach.legacy' }, null, 2)}\n`);
  expectFailure(
    run(),
    'Unexpected TestFlight bundle identifier',
    'Legacy bundle identifier regression',
  );

  writeFileSync(metadataUrl, `${JSON.stringify({ ...originalMetadata, platforms: ['iPhone', 'iPad'] }, null, 2)}\n`);
  expectFailure(
    run(),
    'RC must target iPhone only',
    'iPad target regression',
  );

  console.log('FitCoach Next TestFlight preflight regression suite passed.');
} finally {
  writeFileSync(metadataUrl, originalMetadataText);
}
