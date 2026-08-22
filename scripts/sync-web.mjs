import { cp, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'www');
const staging = path.join(root, '.www-staging');
const backup = path.join(root, '.www-backup');
const webFiles = [
  'index.html', 'privacy.html', 'support.html', 'styles.css', 'enhance-v34.css', 'daily-coach-v34.css', 'data.js',
  'nutrition-data.js', 'exercise-equivalents.js', 'local-date-v345.js', 'app.js',
  'nutrition-data-gen-v34.js', 'nutrition-profile-v346.js', 'nutrition-log-v347.js', 'nutrition-ui-v34.js', 'photo-storage-v34.js', 'progress-v34.js', 'backup-v34.js', 'progression-engine-v34.js', 'daily-coach-v34.js',
  'evidence-plan-v342.js', 'workout-draft-v343.js', 'workout-save-v344.js', 'weekly-adaptation-v36.js', 'weekly-review-ui-v36.js', 'coach-workspace-v40.js', 'manifest.webmanifest', 'version.json', 'sw.js',
  'icon-192.png', 'icon-512.png'
];

const audit = spawnSync(process.execPath, [path.join(root, 'scripts/audit.mjs')], { cwd: root, encoding: 'utf8' });
process.stdout.write(audit.stdout);
process.stderr.write(audit.stderr);
if (audit.status !== 0) process.exit(audit.status ?? 1);

await rm(staging, { recursive: true, force: true });
await rm(backup, { recursive: true, force: true });
await mkdir(staging, { recursive: true });

try {
  for (const file of webFiles) await cp(path.join(root, file), path.join(staging, file));
  await rename(destination, backup).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await rename(staging, destination);
  await rm(backup, { recursive: true, force: true });
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  await rename(backup, destination).catch(() => {});
  throw error;
}
console.log(`www sincronizado: ${webFiles.length} recursos.`);
