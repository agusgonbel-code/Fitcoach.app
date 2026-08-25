import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/release-stress.yml', import.meta.url), 'utf8');

test('release stress workflow remains dispatchable and keeps the 1000x matrix', () => {
  assert.match(workflow, /name:\s*FitCoach Release Stress 1000x/);
  assert.match(workflow, /shard:\s*\[1,2,3,4,5,6,7,8,9,10\]/);
  assert.match(workflow, /seq 1 100/);
  assert.doesNotMatch(workflow, /^\s*run:\s+[^|>\n]*RESULT:/m,'Un colon sin entrecomillar en un scalar run invalida el YAML de GitHub Actions');
  assert.match(workflow, /run:\s*\|\s*\n\s*grep -q '\^RESULT: PASS\$'/,'El enforcement final debe usar un bloque YAML válido');
});
