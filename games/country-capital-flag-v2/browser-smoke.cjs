/* Browser smoke check: run from repository root after npm install --no-save playwright
   and npx playwright install chromium. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1366,height:1024},deviceScaleFactor:1,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8765/games/country-capital-flag-v2/';
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.screenshot({path:'/tmp/country-v2-home.png',fullPage:true});
 assert.equal(await page.locator('#home').isVisible(),true,'home visible');
 await page.locator('#home button[data-go="continents"]').click();
 assert.equal(await page.locator('#continents').isVisible(),true,'continents visible');
 await page.locator('#continents button[data-continent="아시아"]').click();
 assert.equal(await page.locator('#topics').isVisible(),true,'topics visible');
 await page.screenshot({path:'/tmp/country-v2-topics.png',fullPage:true});
 const topic=page.locator('#topics button[data-topic="flag-country"]');
 assert.equal(await topic.count()>0,true,'flag-country choice exists');
 await topic.first().click();
 assert.equal(await page.locator('#countries').isVisible(),true,'countries visible');
 await page.screenshot({path:'/tmp/country-v2-countries.png',fullPage:true});
 console.log('Browser navigation smoke checks passed');
 if(errors.length)console.warn('Browser errors:',errors);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
