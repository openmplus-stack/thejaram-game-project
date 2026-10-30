/* Run from repository root: node games/country-capital-flag-v2/tests/treasure-integrity.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/rewards.js'), 'utf8'), context);
const files = [...context.window.CountryV2RewardFiles];
const countriesSource = fs.readFileSync(path.join(root, 'data/countries.js'), 'utf8');
const codes = [...countriesSource.matchAll(/country:'[^']+',capital:'[^']*',flag:'([^']+)'/g)].map(m => m[1]);
assert.equal(codes.length, 195, 'Expected 195 country records');
assert.equal(new Set(codes).size, 195, 'Duplicate country code');
assert.equal(files.length, 195, 'Expected 195 reward mappings');
const rewardCodes = files.map(file => {
  const match = /^reward-([a-z]{2})-[a-z0-9-]+\.png$/.exec(file);
  assert.ok(match, 'Invalid reward filename: ' + file);
  assert.ok(fs.existsSync(path.join(root, 'assets', file)), 'Missing image: ' + file);
  return match[1];
});
assert.equal(new Set(rewardCodes).size, 195, 'More than one reward per country');
assert.deepEqual(rewardCodes.slice().sort(), codes.slice().sort(), 'Country/reward code mismatch');
for (const name of ['treasure-book.js', 'treasure-reward.js']) {
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  assert.ok(source.includes("'./assets/'+encodeURIComponent("), 'Wrong reward path in ' + name);
  assert.ok(!source.includes("../country-capital-flag/assets/rewards/"), 'Legacy reward path in ' + name);
}
console.log('PASS: 195 unique countries, 195 mapped reward files, all image paths exist.');
