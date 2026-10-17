// Run from repository root: node games/country-capital-flag/check-ui-structure.cjs
// Static checks only; this does not replace browser/iPad visual testing.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const count = (re) => [...html.matchAll(re)].length;
const checks = [
  ['balanced style tags', () => assert.equal(count(/<style\b/gi), count(/<\/style>/gi))],
  ['balanced script tags', () => assert.equal(count(/<script\\b/gi), count(/<\\/script>/gi))],
  ['unique HTML IDs', () => {
    const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'duplicate id attributes');
  }],
  ['JavaScript ID selectors resolve', () => {
    const ids = new Set([...html.matchAll(/\\bid="([^"]+)"/g)].map(match => match[1]));
    const selectors = [...html.matchAll(/\\$\\('#([^']+)'\\)/g)].map(match => match[1]);
    const missing = [...new Set(selectors.filter(id => !ids.has(id)))];
    assert.deepEqual(missing, []);
  }],
  ['collection screens and counters exist', () => {
    for (const id of ['flagCollectionFlow','treasureCollectionFlow','flagCollectionGrid','treasureCollectionGrid','flagCollectionCount','treasureCollectionCount','flagCollectionBack','treasureCollectionBack']) {
      assert.ok(html.includes('id="'+id+'"'), 'missing '+id);
    }
  }],
  ['collection save handlers and modal close logic exist', () => {
    for (const fragment of ["$('#saveRewardFlag').onclick", "$('#saveTreasure').onclick", "function openFlagDetail(it)", "function openTreasureDetail(t)", "function showFlow(id)"]) {
      assert.ok(html.includes(fragment), 'missing '+fragment);
    }
  }],

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
