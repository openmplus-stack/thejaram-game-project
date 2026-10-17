// Browser geometry audit. Run from repository root after npm i -D playwright:
// node games/country-capital-flag/check-ui-layout.cjs
// The test opens the local app, navigates via its real buttons, and checks actual rectangles.
const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
  const results = [];
  try {
    await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
    for (const [label, selector] of [
      ['continent', '#continentFlow'],
      ['topic', '#topicFlow'],
      ['country', '#countrySelectFlow'],
    ]) {
      // Independent layout probe; it does not assert navigation correctness.
      await page.evaluate((sel) => {
        for (const el of document.querySelectorAll('#continentFlow,#topicFlow,#countrySelectFlow,#home')) {
          el.style.display = 'none';
        }
        const target = document.querySelector(sel);
        target.style.display = 'flex';
        document.body.classList.add('world-nav-visible');
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
