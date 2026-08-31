import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

const release = readJson('release-metadata.json');
const store = readJson('app-store-connect-metadata.json');

const failures = [];
const requireValue = (condition, message) => {
  if (!condition) failures.push(message);
};
const isHttps = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
const hasPlaceholder = (value) => /todo|tbd|placeholder|example\.com|lorem ipsum/i.test(String(value ?? ''));

requireValue(store.productName === release.productName, 'App Store productName must match release metadata.');
requireValue(store.primaryLocale === release.primaryLocale, 'App Store locale must match release metadata.');
requireValue(store.primaryCategory === release.category, 'App Store category must match release metadata.');
requireValue(store.privacyPolicyUrl === release.privacyPolicyUrl, 'Privacy policy URL must match release metadata.');
requireValue(store.supportUrl === release.supportUrl, 'Support URL must match release metadata.');
requireValue(JSON.stringify(store.platforms) === JSON.stringify(release.platforms), 'App Store platforms must match release metadata.');
requireValue(isHttps(store.privacyPolicyUrl), 'Privacy policy URL must use HTTPS.');
requireValue(isHttps(store.supportUrl), 'Support URL must use HTTPS.');
requireValue(typeof store.subtitle === 'string' && store.subtitle.trim().length > 0 && store.subtitle.length <= 30, 'Subtitle must be present and at most 30 characters.');
requireValue(typeof store.description === 'string' && store.description.trim().length >= 120 && store.description.length <= 4000, 'Description must be 120-4000 characters.');
requireValue(Array.isArray(store.keywords) && store.keywords.length >= 3, 'At least three App Store keywords are required.');
requireValue(Array.isArray(store.keywords) && new Set(store.keywords.map((k) => String(k).trim().toLowerCase())).size === store.keywords.length, 'App Store keywords must be unique.');
requireValue(Array.isArray(store.keywords) && store.keywords.every((k) => typeof k === 'string' && k.trim().length > 0), 'App Store keywords must be non-empty strings.');
requireValue(Array.isArray(store.keywords) && store.keywords.join(',').length <= 100, 'Combined App Store keyword field must be at most 100 characters.');
requireValue(typeof store.reviewNotes === 'string' && store.reviewNotes.trim().length >= 80, 'Review notes must explain the RC behavior.');

for (const [key, value] of Object.entries(store)) {
  const serialized = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  requireValue(!hasPlaceholder(serialized), `App Store metadata contains a placeholder in ${key}.`);
}

requireValue(release.tracking === false, 'Release metadata must keep tracking disabled.');
requireValue(release.remoteAnalytics === false, 'Release metadata must keep remote analytics disabled.');
requireValue(release.progressPhotosRemoteByDefault === false, 'Progress photos must remain local by default.');

if (failures.length) {
  console.error('App Store metadata audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('App Store Connect RC metadata audit passed.');
