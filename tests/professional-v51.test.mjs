import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=await readFile(new URL('../fitcoach-v5.css',import.meta.url),'utf8');
const pro=await readFile(new URL('../professional-v51.css',import.meta.url),'utf8');
test('FitCoach v5 loads the professional presentation layer',()=>{assert.match(base,/professional-v51\.css/);});
test('professional layer keeps mobile, focus and reduced-motion protections',()=>{assert.match(pro,/safe-area-inset-bottom/);assert.match(pro,/focus-visible/);assert.match(pro,/prefers-reduced-motion/);assert.match(pro,/nav\{grid-template-columns:repeat\(6/);});
