// Run from repository root: node games/country-capital-flag/check-ui-structure.cjs
// Static checks only; this does not replace browser/iPad visual testing.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const count = (re) => [...html.matchAll(re)].length;
const checks = [
  ['balanced style tags', () => assert.equal(count(/<style\b/gi), count(/<\/style>/gi))],
  ['one shared footer', () => assert.equal(count(/id="worldBottomNav"/g), 1)],
  ['one continent heading', () => assert.equal(count(/<div class="flowTitle">대륙 선택<\/div>/g), 1)],
  ['one topic heading', () => assert.equal(count(/<div class="flowTitle">학습 방식 선택<\/div>/g), 1)],
  ['one country heading', () => assert.equal(count(/<div class="flowTitle">국가 선택<\/div>/g), 1)],
  ['one canonical style block', () => assert.equal(count(/<style id="selection-ui-canonical-v1">/g), 1)],
  ['five-column country grid', () => assert.match(html, /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/)],
  ['shared 4:3 stage', () => assert.match(html, /aspect-ratio:4\s*\/\s*3!important/)],
];
let failures = 0;
for (const [name, check] of checks) {
  try { check(); console.log('PASS', name); }
  catch (error) { failures++; console.error('FAIL', name, error.message); }
}
if (failures) process.exitCode = 1;
