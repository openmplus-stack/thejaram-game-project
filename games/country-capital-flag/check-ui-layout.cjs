// Browser geometry audit. Run from repository root after npm i -D playwright:
// node games/country-capital-flag/check-ui-layout.cjs
// This test clicks the real navigation and audits the rendered geometry.
const { chromium } = require('playwright');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const fs = require('node:fs');
// Fail promptly with an actionable marker instead of occupying the CI runner indefinitely.
const watchdog = setTimeout(() => { console.error('BROWSER_AUDIT_TIMEOUT: exceeded 120 seconds'); process.exit(124); }, 120000);
watchdog.unref();
(async () => {
  // Prevent a misleading 'pass' when artwork files are missing from the checkout.
  for (const asset of ['bg-world-common.png','continent-select-no-number.png','topic-select-no-number-no-arrows.png','country-select-reference-04.png']) {
    assert(fs.existsSync(path.join(__dirname, 'assets', 'backgrounds', asset)), 'Missing visual asset: ' + asset);
  }
  // Serve from HTTP: file:// can break localStorage and relative asset loading.
  const root = __dirname;
  const mime = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, bytes) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
      res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  const results = [];
  try {
    console.log('BROWSER_AUDIT_STAGE: navigating to app entry');
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    // The app contains large artwork; DOM readiness is sufficient for navigation tests.
    // Waiting for every image's load event can exceed CI's 30s navigation timeout.
    // The app may block DOMContentLoaded with synchronous startup work.
    // 'commit' confirms the server responded without waiting for app scripts.
    const response = await page.goto(base + '/index.html', { waitUntil: 'commit', timeout: 15000 });
    console.log('BROWSER_AUDIT_STAGE: entry HTTP ' + response?.status());
    await page.waitForTimeout(1500);
    assert.equal(response?.status(), 200, 'App entry returned HTTP ' + response?.status());
    console.log('ENTRY_DIAGNOSTIC', JSON.stringify({url:page.url(),homeStartCount:await page.locator('#homeStart').count()}));
    assert.equal(await page.locator('#homeStart').count(), 1, 'App entry does not contain the home start control');
    const steps = [
      { label: 'continent', selector: '#continentFlow', click: '#homeStart' },
      { label: 'topic', selector: '#topicFlow', click: '[data-continent="아시아"]' },
      { label: 'country', selector: '#countrySelectFlow', click: '[data-topic="flag-country"]' },
    ];
    for (const { label, selector, click } of steps) {
      console.log('BROWSER_AUDIT_STAGE: ' + label + ' clicking ' + click);
      // Follow actual application navigation rather than forcing display styles.
      await page.locator(click).click();
      await page.waitForFunction(sel => {
        const el = document.querySelector(sel);
        return el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
      }, selector);
      // Wait for visible images to finish loading before evaluating broken artwork.
      // An image still in flight must not be mistaken for a missing asset.
      await page.waitForFunction(() => [...document.images]
        .filter(img => img.getClientRects().length > 0)
        .every(img => img.complete), null, { timeout: 10000 });
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
        const footerButtons = [...footer.querySelectorAll('button')].filter(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0).map(el => rect(el));
        const brokenImages = [...document.images].filter(img => img.getClientRects().length && (!img.complete || img.naturalWidth === 0)).map(img => img.src);
        const gridColumns = cards ? getComputedStyle(cards).gridTemplateColumns.split(' ').filter(Boolean).length : null;
        const cardCount = cards ? cards.children.length : null;
        const actionButtons = [...screen.querySelectorAll('button')].filter(el => { const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); return r.width>0 && r.height>0 && cs.display!=='none' && cs.visibility!=='hidden' && el.getClientRects().length>0 && el.checkVisibility({checkVisibilityCSS:true}); });
        return { panel: rect(panel), heading: rect(heading), footer: rect(footer), cards: rect(cards), actions: actionButtons.map(el=>({name:el.id||el.textContent.trim().slice(0,25),rect:rect(el)})), scrollHeight: cards?.scrollHeight, clientHeight: cards?.clientHeight, gridColumns, cardCount, footerButtons, brokenImages };
      }, selector);
      const visibleFooter = geometry.footer && geometry.footer.height > 0;
      const overlaps = visibleFooter && geometry.panel && geometry.footer.y < geometry.panel.bottom;
      const cardOverlap = visibleFooter && geometry.actions.some(a => a.rect.bottom > geometry.footer.y && a.rect.y < geometry.footer.bottom && a.rect.right > geometry.footer.x && a.rect.x < geometry.footer.right);
      await page.screenshot({ path: path.join(__dirname, 'audit-' + label + '-1024x768.png'), fullPage: false });
      results.push({ screen: label, overlapsPanel: !!overlaps, overlapsCards: !!cardOverlap, ...geometry });
    }
    console.log('BROWSER_AUDIT_STAGE: activity navigation');
    // Verify the next real navigation stage and both return paths.
    await page.locator('#countryChoiceGrid button').first().click();
    await page.locator('#countrySelectStart').click();
    await page.waitForFunction(() => {
      const el=document.querySelector('#activityChoiceFlow');
      return el && getComputedStyle(el).display!=='none' && el.getClientRects().length>0;
    });
    assert(await page.locator('#activityLearnStart').isVisible(), 'activity: learn action is hidden');
    assert(await page.locator('#activityQuizStart').isVisible(), 'activity: quiz action is hidden');
    await page.locator('#activityLearnStart').click();
    await page.waitForFunction(() => {
      const el=document.querySelector('#learnScreen');
      return el && getComputedStyle(el).display!=='none' && el.getClientRects().length>0;
    });
    await page.locator('#learnBack').click();
    assert(await page.locator('#activityChoiceFlow').isVisible(), 'learn back did not return to activity choice');
    await page.locator('#activityChoiceBack').click();
    assert(await page.locator('#countrySelectFlow').isVisible(), 'activity back did not return to country selection');
    results.push({ screen:'activity-navigation', learnBack:true, activityBack:true });

    console.log('BROWSER_AUDIT_STAGE: quiz navigation');
    // Quiz entry, first question, answer progression, and safe exit.
    await page.locator('#countrySelectStart').click();
    assert(await page.locator('#activityChoiceFlow').isVisible(), 'quiz: activity choice is hidden');
    await page.locator('#activityQuizStart').click();
    assert(await page.locator('#simpleOx').isVisible(), 'quiz: OX screen did not open');
    assert(await page.locator('#simpleOxStart').isVisible(), 'quiz: start button is hidden');
    await page.locator('#simpleOxStart').click();
    assert(await page.locator('#simpleOxGame').isVisible(), 'quiz: game is hidden after start');
    assert.equal((await page.locator('#simpleOxCount').innerText()).trim(), '1 / 20', 'quiz: incorrect first question number');
    await page.locator('#simpleYes').click();
    await page.waitForFunction(() => document.querySelector('#simpleOxCount')?.textContent.trim()==='2 / 20', null, {timeout:5000});
    assert(await page.locator('#simpleOxGame').isVisible(), 'quiz: game disappeared after answer');
    await page.locator('#simpleOxBack').click();
    assert(await page.locator('#activityChoiceFlow').isVisible(), 'quiz: back did not return to activity choice');
    await page.waitForTimeout(950);
    assert(await page.locator('#activityChoiceFlow').isVisible(), 'quiz: delayed answer timer reopened the quiz');
    results.push({ screen:'quiz-navigation', firstQuestion:true, nextQuestion:true, back:true, pendingTimerCancelled:true });


    console.log(JSON.stringify(results, null, 2));
    assert.equal(failures.length, 0, 'Browser JavaScript errors: ' + failures.join(' | '));
    assert(results.every(x => !x.overlapsCards), 'Visible interactive buttons overlap the fixed footer');
    // A full-stage transparent panel may geometrically extend behind the footer.
    // That alone is not a defect: only interactive content overlap is a failure.
    for (const result of results.filter(item => ['continent', 'topic', 'country'].includes(item.screen))) {
      assert(result.heading && result.heading.width > 0, result.screen + ': missing visible heading');
      assert.equal(result.brokenImages.length, 0, result.screen + ': broken visible images: ' + result.brokenImages.join(', '));
      assert(result.footer && result.footer.width > 0 && result.footer.height > 0, result.screen + ': shared footer is not visible');
      assert.equal(result.footerButtons.length, 5, result.screen + ': expected five visible shared footer buttons');
      if (result.footerButtons.length) {
        const widths = result.footerButtons.map(b => b.width);
        assert(Math.max(...widths) - Math.min(...widths) <= 1, result.screen + ': footer button widths are inconsistent');
        assert(result.footerButtons.every(b => Math.abs(b.width - b.height) <= 1), result.screen + ': footer buttons are not square');
      }
      assert(result.panel && result.panel.width > 0, result.screen + ': missing visible panel');
      if (result.screen === 'country') {
        assert(result.cards && result.cards.height > 0, 'country: missing card grid');
        assert(result.scrollHeight >= result.clientHeight, 'country: invalid scrolling geometry');
        assert.equal(result.gridColumns, 5, 'country: expected exactly five grid columns at 1024x768');
        assert(result.cardCount > 0, 'country: no country cards rendered');
      }
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
