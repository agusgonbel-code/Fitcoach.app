import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bootstrap=fs.readFileSync(new URL('../bootstrap-v48.js',import.meta.url),'utf8');
const guard=fs.readFileSync(new URL('../intake-layout-v6.js',import.meta.url),'utf8');

test('release v6 loads the intake layout guard after unified intake',()=>{
  assert.match(bootstrap,/unified-intake-v35\.js/);
  assert.match(bootstrap,/intake-layout-v6\.js/);
  assert.ok(bootstrap.indexOf('unified-intake-v35.js')<bootstrap.indexOf('intake-layout-v6.js'));
});

test('intake actions cannot overlap and hidden actions stay non-interactive',()=>{
  assert.match(guard,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(guard,/position:static!important/);
  assert.match(guard,/transform:none!important/);
  assert.match(guard,/button\[hidden\]\{display:none!important\}/);
});
