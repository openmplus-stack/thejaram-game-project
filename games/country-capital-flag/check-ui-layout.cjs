// Browser geometry audit. Run from repository root after npm i -D playwright:
// node games/country-capital-flag/check-ui-layout.cjs
// This is an isolated geometry probe; navigation flow requires a separate interaction test.
const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  // Prevent a misleading 'pass' when artwork files are missing from the checkout.
  for (const asset of ['bg-world-common.png','continent-select-no-number.png','topic-select-no-number-no-arrows.png','country-select-reference-04.png']) {
    assert(fs.existsSync(path.join(__dirname, 'assets', 'backgrounds', asset)), 'Missing visual asset: ' + asset);
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
  const results = [];
  try {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
    await page.waitForLoadState('load');
    const steps = [
      { label: 'continent', selector: '#continentFlow', click: '#homeStart' },
      { label: 'topic', selector: '#topicFlow', click: '[data-continent="아시아"]' },
      { label: 'country', selector: '#countrySelectFlow', click: '[data-topic="flag-country"]' },
    ];
    for (const { label, selector, click } of steps) {
      // Follow actual application navigation rather than forcing display styles.
      await page.locator(click).click();
      await page.waitForFunction(sel => {
        const el = document.querySelector(sel);
        return el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
      }, selector);
      const geometry = await page.evaluate((sel) => {
        const rect = (node) => {
          if (!node) return null;
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };
        const screen = document.querySelector(sel);
        const panel = screen.querySelector('.flowBox,.countrySelectBox');
        const heading = screen.querySelector('.flowTitle');
        const footer = document.querySelector('#worldBottomNav');
        const cards = screen.querySelector('.countryChoiceGrid');
        const actionButtons = [...screen.querySelectorAll('button')].filter(el => { const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return r.width>0 && r.height>0 && cs.display!=='none' && cs.visibility!=='hidden' && el.getClientRects().length>0 && el.checkVisibility({checkVisibilityCSS:true}); });
        return { panel: rect(panel), heading: rect(heading), footer: rect(footer), cards: rect(cards), actions: actionButtons.map(el=>({name:el.id||el.textContent.trim().slice(0,25),rect:rect(el)})), scrollHeight: cards?.scrollHeight, clientHeight: cards?.clientHeight };
      }, selector);
      const visibleFooter = geometry.footer && geometry.footer.height > 0;
      const overlaps = visibleFooter && geometry.panel && geometry.footer.y < geometry.panel.bottom;
      const cardOverlap = visibleFooter && geometry.actions.some(a => a.rect.bottom > geometry.footer.y && a.rect.y < geometry.footer.bottom && a.rect.right > geometry.footer.x && a.rect.x < geometry.footer.right);
      await page.screenshot({ path: path.join(__dirname, 'audit-' + label + '-1024x768.png'), fullPage: false });
      results.push({ screen: label, overlapsPanel: !!overlaps, overlapsCards: !!cardOverlap, ...geometry });
    }
    console.log(JSON.stringify(results, null, 2));
    assert.equal(failures.length, 0, 'Browser JavaScript errors: ' + failures.join(' | '));
    assert(results.every(x => !x.overlapsCards), 'Visible interactive buttons overlap the fixed footer');
    // A full-stage transparent panel may geometrically extend behind the footer.
    // That alone is not a defect: only interactive content overlap is a failure.
    for (const result of results) {
      assert(result.heading && result.heading.width > 0, result.screen + ': missing visible heading');
      assert(result.panel && result.panel.width > 0, result.screen + ': missing visible panel');
      if (result.screen === 'country') {
        assert(result.cards && result.cards.height > 0, 'country: missing card grid');
        assert(result.scrollHeight >= result.clientHeight, 'country: invalid scrolling geometry');
      }
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
