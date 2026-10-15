/* Browser regression: two learning modes, O/X and 20-question result.
   Run via GitHub Actions; captures iPad-landscape sized screenshots. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1366,height:1024},deviceScaleFactor:1,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{try{Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},speak(){}}})}catch{}});
 const base='http://127.0.0.1:8765/games/country-capital-flag-v2/';
 const shot=async name=>page.screenshot({path:'/tmp/country-v2-'+name+'.png',fullPage:true});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 assert(await page.locator('#home').isVisible());await shot('home');
 await page.locator('#home button[data-go="continents"]').click();
 assert(await page.locator('#continents').isVisible());
 await page.locator('#continents button[data-continent="아시아"]').click();
 assert(await page.locator('#topics').isVisible());
 // A screen can be 'visible' in the DOM while its content is offscreen or covered.
 await page.locator('#topics .topic-choice').first().waitFor({state:'visible'});
 await page.waitForTimeout(500);
 const topicBoxes=await page.locator('#topics .topic-choice').evaluateAll(els=>els.map(el=>{
   const r=el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;
   const top=document.elementFromPoint(cx,cy);
   return {width:r.width,height:r.height,inViewport:cx>=0&&cx<innerWidth&&cy>=0&&cy<innerHeight,
           unobstructed:!!top&&(top===el||el.contains(top))};
 }));
 assert(topicBoxes.length===2&&topicBoxes.every(b=>b.width>80&&b.height>40&&b.inViewport&&b.unobstructed),
   'topic choices must actually be onscreen and unobstructed: '+JSON.stringify(topicBoxes));
 await shot('topics');
 async function selectTopic(topic){
  await page.locator('#topics button[data-topic="'+topic+'"]').click();
  assert(await page.locator('#countries').isVisible());
  await page.locator('#countries .country-card').first().waitFor();
  const choices=page.locator('#countries .country-card');
  assert((await choices.count())>=2,'at least two countries');
  // Reset selection: it intentionally persists when switching topics within one continent.
  await page.locator('#countryClearAll').click();
  await choices.nth(0).click();await choices.nth(1).click();
  assert.equal(await page.locator('#countryNext').isEnabled(),true);
  await shot('countries-'+topic);
  await page.locator('#countryNext').click();
  assert(await page.locator('#activities').isVisible());
 }
 await selectTopic('flag-country');
 await page.locator('#activities .activity-hit-learning:visible, #activities .activity-legacy button[data-go="learning"]:visible').first().click();
 assert(await page.locator('#learning').isVisible());
 assert.equal(await page.locator('#learningFlag').isHidden(),false,'flag is visible');
 assert((await page.locator('#learningCountry').innerText()).trim().length>0);
 await shot('learning-flag-country');
 await page.locator('#learningNext').click();
 assert(await page.locator('#learning').isVisible());
 await page.locator('#learning [data-go="continents"]').click();
 await page.locator('#continents button[data-continent="아시아"]').click();
 await selectTopic('country-capital');
 await page.locator('#activities .activity-hit-learning:visible, #activities .activity-legacy button[data-go="learning"]:visible').first().click();
 assert(await page.locator('#learning').isVisible());
 assert.equal(await page.locator('#learningFlag').isHidden(),true,'capital mode hides flag');
 assert((await page.locator('#learningCapital').innerText()).trim().length>0);
 await shot('learning-country-capital');
 await page.locator('#learning [data-go="countries"]').click();
 await page.locator('#countryNext').click();
 await page.locator('#activities .activity-hit-quiz:visible, #activities .activity-legacy button[data-go="quiz"]:visible').first().click();
 assert(await page.locator('#quiz').isVisible());
 assert.equal((await page.locator('#quizProgress').innerText()).trim(),'1 / 20');
 assert((await page.locator('#quizRightText').innerText()).trim().length>0);
 const paddles=await page.locator('#quiz .quiz-answers button img').evaluateAll(imgs=>imgs.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height})));
 assert.equal(paddles.length,2,'two paddle images');
 assert(paddles.every(p=>p.loaded&&p.width>20&&p.height>20),'paddle assets visible: '+JSON.stringify(paddles));
 assert(paddles[0].src.includes('quiz-ox-o-hand.webp')&&paddles[1].src.includes('quiz-ox-x-hand.webp'));
 const rects=await page.evaluate(()=>{const get=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return {stats:get('#quiz .quiz-stats'),pair:get('#quiz .quiz-pair'),answers:get('#quiz .quiz-answers'),footer:get('#quiz .quiz-footer button')}});
 assert(rects.stats.bottom<rects.pair.top&&rects.pair.bottom<rects.answers.top,'quiz vertical spacing: '+JSON.stringify(rects));
 await shot('quiz-country-capital');
 await page.locator('#quizBpmPlus').click();
 assert.equal(await page.locator('#quizBpm').inputValue(),'70');
 for(let i=0;i<20;i++){
  await page.locator('#quizYes').click();
  assert(await page.locator('#quizAdvance').isVisible());
  await page.locator('#quizAdvance').click();
 }
 assert(await page.locator('#result').isVisible(),'result visible after 20 answers');
 await shot('result');
 assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
 console.log('PASS: home, topics, countries, flag learning, capital learning, quiz BPM, 20 questions, result');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
