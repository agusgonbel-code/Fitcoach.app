import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/browser-smoke.yml', import.meta.url), 'utf8');

test('fast release gate includes unit regressions and browser coverage in one verdict', () => {
  assert.match(workflow, /npm test/,'El release gate debe ejecutar la suite unitaria, no solo Playwright');
  assert.match(workflow, /UNIT_EXIT_CODE/,'El informe debe conservar el resultado unitario');
  assert.match(workflow, /BROWSER_EXIT_CODE/,'El informe debe conservar el resultado de navegador');
  assert.match(workflow, /unit_code[^\n]*-ne 0[^\n]*browser_code[^\n]*-ne 0|unit_code[\s\S]*browser_code[\s\S]*overall_code/,'El veredicto debe bloquear release si falla cualquiera de las dos capas');
});
