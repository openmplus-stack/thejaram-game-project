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
 await page.locator('#home button[data-go="treasures"]').click();
 assert(await page.locator('#treasures').isVisible());
 assert.equal(await page.locator('#treasureBookGrid .treasure-book-item').count(),0,'empty treasure gallery hides unearned items');
 assert(await page.locator('#treasureBookEmpty').isVisible(),'empty treasure message');
 assert((await page.locator('#treasureBookSummary').innerText()).includes('전체 180개'));
 assert.equal(await page.locator('#treasures .treasure-bottom-nav button').count(),5,'shared five-button navigation');
 await shot('treasures-empty');
 await page.evaluate(()=>localStorage.setItem('countryTreasureCollection',JSON.stringify([window.CountryV2RewardFiles.find(f=>/^(?:\d+[-_])?reward-[a-z]{2}-/.test(f))])));
 await page.evaluate(()=>window.CountryV2TreasureBook.render());
 assert.equal(await page.locator('#treasureBookGrid .treasure-book-item').count(),1,'one collected treasure visible');
 assert.equal(await page.locator('#treasureBookGrid .treasure-book-item').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','no individual treasure card');
 await shot('treasures-collected');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#home button[data-go="treasures"]').click();
 assert.equal(await page.locator('#treasureBookGrid .treasure-book-item').count(),1,'collected treasure persists after reload');
 await page.locator('#treasures .treasure-bottom-nav [data-go="home"]').click();

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
  const scrollCheck=await page.locator('#countries .country-grid').evaluate(el=>{
    const start=el.scrollTop;
    el.scrollTop=el.scrollHeight;
    return {start,end:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
  });
  assert(scrollCheck.scrollHeight<=scrollCheck.clientHeight+2 || scrollCheck.end>scrollCheck.start,
    'country list must scroll to the end: '+JSON.stringify(scrollCheck));
  await page.screenshot({path:'country-v2-countries-scrolled-end.png'});
  await page.locator('#countries .country-grid').evaluate(el=>{el.scrollTop=0});

  // Check the entire scroll range, not only the initially visible country rows.
  const scrollAudit=await page.locator('#countries .country-grid').evaluate(async el=>{
    const before=el.scrollTop;
    el.scrollTop=el.scrollHeight;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const end=el.scrollTop, max=el.scrollHeight-el.clientHeight;
    const last=el.lastElementChild;
    const a=el.getBoundingClientRect(), b=last?.getBoundingClientRect();
    const visible=!!b&&b.bottom<=a.bottom+2&&b.top>=a.top-2;
    el.scrollTop=before;
    return {end,max,visible,count:el.children.length};
  });
  assert(scrollAudit.visible&&scrollAudit.end>=scrollAudit.max-2,
    'last country card must be visible at end of scroll: '+JSON.stringify(scrollAudit));

  const countryArtwork=await page.locator('#countries .country-main-panel').evaluate(el=>{
   const css=getComputedStyle(el);
   return {background:css.backgroundImage,border:css.borderTopWidth,
    before:getComputedStyle(el,'::before').content,after:getComputedStyle(el,'::after').content};
  });
  assert(countryArtwork.background.includes('ui-collection-parchment.png')&&countryArtwork.border==='0px'&&
   countryArtwork.before==='none'&&countryArtwork.after==='none',
   'country panel must use approved parchment, not a legacy CSS rectangle: '+JSON.stringify(countryArtwork));
  // Reset selection: it intentionally persists when switching topics within one continent.
  await page.locator('#countryClearAll').click();
  await choices.nth(0).click();await choices.nth(1).click();
  assert.equal(await page.locator('#countryNext').isEnabled(),true);
  await page.locator('#countries .country-grid').evaluate(el=>el.scrollTop=el.scrollHeight);
  const endLayout=await page.locator('#countries').evaluate(root=>{
   const panel=root.querySelector('.country-main-panel'),grid=root.querySelector('.country-grid'),next=root.querySelector('#countryNext');
   const p=panel.getBoundingClientRect(),g=grid.getBoundingClientRect(),n=next.getBoundingClientRect();
   const last=grid.querySelector('.country-card:last-child').getBoundingClientRect();
   return {panelBottom:p.bottom,gridBottom:g.bottom,nextTop:n.top,lastBottom:last.bottom,
    gridNextGap:n.top-g.bottom,lastBottomGap:g.bottom-last.bottom,
    noOverlap:g.bottom<=n.top-2,buttonWithinPanel:n.bottom<=p.bottom+3};
  });
  assert(endLayout.noOverlap&&endLayout.buttonWithinPanel&&endLayout.lastBottomGap>=8,
   'country scroll end and next button must not overlap: '+JSON.stringify(endLayout));

  const endHit=await page.locator('#countryGrid .country-card').last().evaluate(el=>{const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);return {visible:!!top&&(top===el||el.contains(top)),x,y};});
  assert(endHit.visible,'last scrolled country must be touch-accessible: '+JSON.stringify(endHit));
  const footerClearance=await page.locator('#countries').evaluate(root=>{const a=root.querySelector('.country-main-panel').getBoundingClientRect(),b=root.querySelector('.country-bottom-nav').getBoundingClientRect();return {gap:b.top-a.bottom,panelBottom:a.bottom,footerTop:b.top}});
  assert(footerClearance.gap>=0,'country parchment must not overlap footer navigation: '+JSON.stringify(footerClearance));
  await shot('countries-scroll-end-'+topic);
  await page.locator('#countries .country-grid').evaluate(el=>el.scrollTop=0);
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
 const firstLearningCountry=(await page.locator('#learningCountry').innerText()).trim();
 assert.equal(await page.locator('#learningCount').innerText(),'1 / 2');
 assert(await page.locator('#learningNext').isEnabled(),'next country must be enabled');
 await page.locator('#learningNext').click();
 assert.equal(await page.locator('#learningCount').innerText(),'2 / 2','next must advance to the second selected country');
 assert.notEqual((await page.locator('#learningCountry').innerText()).trim(),firstLearningCountry,'next must show another selected country');
 assert(await page.locator('#learning').isVisible());
 await page.locator('#learningNext').click(); // finish both selected countries
 assert(await page.locator('#countries').isVisible(),'learning completion must return to country selection');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('countryFlagCollection')).length),2,'completion awards both flags');
 await page.evaluate(()=>window.CountryV2.home());
 await page.locator('#home button[data-go="flags"]').click();
 assert(await page.locator('#flags').isVisible());
 assert.equal(await page.locator('#flagsCollection .flags-item').count(),2,'two earned flags visible in gallery');
 assert((await page.locator('#flagsSummary').innerText()).includes('2개'));
 assert.equal(await page.locator('#flagsCollection .flags-item').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','flag items must have no white card');
 await shot('flags-collected');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#home button[data-go="flags"]').click();
 assert.equal(await page.locator('#flagsCollection .flags-item').count(),2,'earned flags persist across reload');
 await page.locator('#flags .flags-bottom-nav [data-go="continents"]').click();
 assert(await page.locator('#continents').isVisible());
 await page.locator('#continents button[data-continent="아시아"]').click();
 await selectTopic('country-capital');
 await page.locator('#activities .activity-hit-learning:visible, #activities .activity-legacy button[data-go="learning"]:visible').first().click();
 assert(await page.locator('#learning').isVisible());
 assert.equal(await page.locator('#learningFlag').isHidden(),true,'capital mode hides flag');
 assert((await page.locator('#learningCapital').innerText()).trim().length>0);
 // Verify long Korean names wrap inside the fixed half-card without clipping.
 const longNameLayout=await page.evaluate(()=>{
  const panel=document.querySelector('#learning .learning-card');
  const country=document.querySelector('#learningCountry');
  const capital=document.querySelector('#learningCapital');
  const previous=[country.textContent,capital.textContent];
  const originalDisplay=[country.style.display,capital.style.display];
  const results=[];
  for(const [el,value] of [[country,'보스니아 헤르체고비나'],[capital,'스리자야와르데네푸라코테']]){
   el.textContent=value;el.style.display='block';
   const box=el.getBoundingClientRect(),parent=panel.getBoundingClientRect();
   results.push({value,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
    height:box.height,parentHeight:parent.height,overflowX:el.scrollWidth>el.clientWidth+2,
    overflowY:box.height>parent.height+2});
  }
  country.textContent=previous[0];capital.textContent=previous[1];
  country.style.display=originalDisplay[0];capital.style.display=originalDisplay[1];
  return results;
 });
 assert(longNameLayout.every(x=>!x.overflowX&&!x.overflowY),
  'long country/capital labels must fit within learning card: '+JSON.stringify(longNameLayout));


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
 assert(paddles[0].src.includes('quiz-o-circle.svg')&&paddles[1].src.includes('quiz-x-circle.svg'));
 // Diagnose whether the original WebP pixels, rather than CSS, paint a square.
 const paddlePixels=await page.locator('#quiz .quiz-answers button img').evaluateAll(imgs=>imgs.map(img=>{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const sample=(x,y)=>Array.from(ctx.getImageData(Math.round(x*(canvas.width-1)),Math.round(y*(canvas.height-1)),1,1).data);
   return {src:img.getAttribute('src'),size:[canvas.width,canvas.height],corners:[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>sample(x,y)),edges:[[.5,0],[0,.5],[1,.5],[.5,1]].map(([x,y])=>sample(x,y)),center:sample(.5,.5)};
 }));
 console.log('QUIZ_PADDLE_WEBP_PIXEL_DIAGNOSTIC',JSON.stringify(paddlePixels));
 const paddleAlphaGrid=await page.locator('#quiz .quiz-answers button img').evaluateAll(imgs=>imgs.map(img=>{
   const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const grid=[];for(let y=0;y<=20;y++){let row='';for(let x=0;x<=20;x++){
     const p=ctx.getImageData(Math.round(x*(c.width-1)/20),Math.round(y*(c.height-1)/20),1,1).data;
     row+=p[3]<16?'.':p[3]<160?'+':p[2]>p[0]*1.4&&p[2]>p[1]*1.2?'B':p[0]>p[1]*1.4&&p[0]>p[2]*1.4?'R':'#';
   }grid.push(row)}return {src:img.getAttribute('src'),grid};
 }));
 console.log('QUIZ_PADDLE_ALPHA_GRID',JSON.stringify(paddleAlphaGrid));
 const paddleCss=await page.locator('#quiz .quiz-answers button').evaluateAll(btns=>btns.map(btn=>{
   const img=btn.querySelector('img');const describe=el=>{const c=getComputedStyle(el);return {backgroundColor:c.backgroundColor,backgroundImage:c.backgroundImage,border:c.border,boxShadow:c.boxShadow,outline:c.outline,filter:c.filter,opacity:c.opacity}};
   return {id:btn.id,button:describe(btn),before:{content:getComputedStyle(btn,'::before').content,background:getComputedStyle(btn,'::before').background},after:{content:getComputedStyle(btn,'::after').content,background:getComputedStyle(btn,'::after').background},image:describe(img),container:describe(btn.parentElement)};
 }));
 console.log('QUIZ_PADDLE_COMPUTED_CSS',JSON.stringify(paddleCss));
 assert(paddleCss.every(p=>p.button.backgroundImage==='none'&&p.button.border.startsWith('0px')&&p.button.boxShadow==='none'&&p.button.backgroundColor==='rgba(0, 0, 0, 0)'),
   'O/X buttons must have no painted rectangle: '+JSON.stringify(paddleCss));




 const rects=await page.evaluate(()=>{const get=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return {stats:get('#quiz .quiz-stats'),pair:get('#quiz .quiz-pair'),answers:get('#quiz .quiz-answers'),footer:get('#quiz .quiz-footer button')}});
 assert(rects.stats.bottom<rects.pair.top&&rects.pair.bottom<rects.answers.top,'quiz vertical spacing: '+JSON.stringify(rects));
 await shot('quiz-country-capital');
 await page.locator('#quizBpmPlus').click();
 assert.equal(await page.locator('#quizBpm').inputValue(),'70');
 for(let i=0;i<20;i++){
  await page.locator('#quizYes').click();
  await page.waitForTimeout(180); // allow CSS background-color transition to settle before checking final color
  const answerColors=await page.locator('#quiz .quiz-pair>.quiz-tile').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor));
  assert(answerColors.length===2&&answerColors.every(color=>color==='rgb(185, 244, 156)'||color==='rgb(255, 119, 119)'), 'both answer cards must be entirely lime or red: '+JSON.stringify(answerColors));
  assert(new Set(answerColors).size===1,'both answer cards must share the same feedback color');
  assert(await page.locator('#quizAdvance').isHidden(),'manual next button must stay hidden');
  if(i<19){await page.waitForTimeout(1100);assert.equal((await page.locator('#quizProgress').innerText()).trim(),(i+2)+' / 20');}
  else {await page.locator('#result').waitFor({state:'visible',timeout:3500});}
 }
 assert(await page.locator('#result').isVisible(),'result visible after 20 answers');
 await shot('result');
 // Reward eligibility remains driven by a perfect 20-question quiz.
 await page.evaluate(()=>{
  const file=window.CountryV2RewardFiles.find(f=>/^(?:\d+[-_])?reward-[a-z]{2}-/.test(f));
  const code=file.match(/reward-([a-z]{2})-/)[1];
  document.dispatchEvent(new CustomEvent('country-v2:quiz-complete',{detail:{score:20,total:20,percentage:100,results:Array.from({length:20},()=>({source:code}))}}));
 });
 await page.locator('#resultReward').click();
 assert(await page.locator('#quizReward').isVisible(),'treasure gift screen');
 assert.equal(await page.locator('#quizReward .gift-bottom-nav button').count(),5,'gift has five footer buttons');
 assert(await page.locator('#quizReward .gift-parchment').isVisible(),'gift uses approved parchment');
 assert(await page.locator('#treasureRewardChoices .treasure-reward-option').count()>0,'eligible gifts appear');
 const firstGift=page.locator('#treasureRewardChoices .treasure-reward-option').first();
 assert.equal(await firstGift.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','gift items have no white cards');
 await firstGift.click();
 assert.equal(await firstGift.getAttribute('aria-pressed'),'true','selected gift highlighted');
 assert(await page.locator('#treasureRewardSave').isEnabled(),'reward button enabled');
 await page.locator('#treasureRewardSave').click();
 assert((await page.locator('#treasureRewardMessage').innerText()).includes('저장했습니다'),'reward saved');
 await page.locator('#quizReward .gift-bottom-nav [data-go="treasures"]').click();
 assert(await page.locator('#treasures').isVisible(),'navigate to treasure catalog');
 assert(await page.locator('#treasureBookGrid .treasure-book-item').count()>0,'earned reward appears in catalog');
 // Check the actual uploaded parchment asset and non-overlapping collection labels.
 const parchmentChecks=await page.evaluate(async()=>{
  const selectors=['#flags .flags-parchment','#treasures .treasure-parchment','#quizReward .gift-parchment'];
  const image=new Image();image.src='./assets/ui-collection-parchment.png';
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('parchment PNG failed to load'))});
  return {loaded:image.naturalWidth>0&&image.naturalHeight>0,
    panels:selectors.map(s=>{const el=document.querySelector(s),cs=getComputedStyle(el);
      return {selector:s,background:cs.backgroundImage,visible:el.getBoundingClientRect().width>0};})};
 });
 assert(parchmentChecks.loaded,'illustrated parchment asset must load');
 assert(parchmentChecks.panels.every(x=>x.background.includes('ui-collection-parchment.png')),
   'all three screens must use the same illustrated parchment: '+JSON.stringify(parchmentChecks));
 const checkTreasureItem=async selector=>{
  const details=await page.locator(selector).first().evaluate(el=>{
   const elements=[el.querySelector('img'),el.querySelector('strong'),el.querySelector('span')];
   const boxes=elements.map(x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}});
   return {boxes,item:el.getBoundingClientRect().height};
  });
  assert(details.boxes[0].bottom<=details.boxes[1].top+1,
    'treasure image must not overlap country: '+JSON.stringify(details));
  assert(details.boxes[1].bottom<=details.boxes[2].top+1,
    'country must not overlap treasure name: '+JSON.stringify(details));
 };
 await checkTreasureItem('#treasureBookGrid .treasure-book-item');
 await page.evaluate(()=>window.CountryV2.go('quizReward'));
 await checkTreasureItem('#treasureRewardChoices .treasure-reward-option');
 await page.evaluate(()=>window.CountryV2.go('flags'));
 await shot('flags-parchment');
 await page.evaluate(()=>window.CountryV2.go('treasures'));
 const catalogPanel=await page.evaluate(()=>{
  const el=document.querySelector('#treasureBookGrid');
  if(!el)return {exists:false};
  const cs=getComputedStyle(el);
  return {exists:true,background:cs.backgroundColor,image:cs.backgroundImage,border:cs.borderTopWidth};
 });
 assert(catalogPanel.exists&&catalogPanel.background==='rgba(0, 0, 0, 0)'&&catalogPanel.image==='none'&&catalogPanel.border==='0px',
   'legacy rectangle must not cover illustrated parchment: '+JSON.stringify(catalogPanel));
 await shot('treasures-parchment');
 await page.evaluate(()=>window.CountryV2.go('quizReward'));
 await shot('gift-parchment');
 // Catch asset load failures on all three approved collection screens.
 const assetLoad=await page.evaluate(async()=>{
  const urls=['./assets/bg-world-clean.png','./assets/ui-collection-parchment.png','./assets/ui-bottom-navigation.png'];
  return Promise.all(urls.map(url=>new Promise(resolve=>{
   const img=new Image();img.onload=()=>resolve({url,ok:true,width:img.naturalWidth,height:img.naturalHeight});
   img.onerror=()=>resolve({url,ok:false});img.src=url;
  })));
 });
 assert(assetLoad.every(x=>x.ok&&x.width>0&&x.height>0),
   'all approved collection assets must load: '+JSON.stringify(assetLoad));

 const approvedBackground=await page.evaluate(()=>{
  const selectors=['#flags .flags-artboard','#treasures .treasure-artboard','#quizReward .gift-artboard'];
  return selectors.map(selector=>({selector,background:getComputedStyle(document.querySelector(selector)).backgroundImage}));
 });
 assert(approvedBackground.every(x=>x.background.includes('bg-world-clean.png')),
   'all collection screens must use approved background: '+JSON.stringify(approvedBackground));

 // Verify the footer PNG keeps its natural aspect ratio and stays inside the 4:3 artboard.
 const navGeometry=await page.evaluate(async()=>{
  const img=new Image();img.src='./assets/ui-bottom-navigation.png';
  await new Promise((ok,fail)=>{img.onload=ok;img.onerror=()=>fail(new Error('navigation image failed to load'))});
  const nativeRatio=img.naturalWidth/img.naturalHeight;
  const selectors=['#flags .flags-bottom-nav','#treasures .treasure-bottom-nav','#quizReward .gift-bottom-nav'];
  return {nativeRatio,entries:selectors.map(s=>{
   const el=document.querySelector(s),r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();
   return {selector:s,ratio:r.width/r.height,backgroundSize:getComputedStyle(el).backgroundSize,
    within:r.left>=p.left-2&&r.right<=p.right+2&&r.top>=p.top-2&&r.bottom<=p.bottom+2,
    buttons:el.querySelectorAll('button').length};
  })};
 });
 assert(navGeometry.entries.every(x=>x.backgroundSize==='contain'&&x.within&&x.buttons===5),
   'footer must preserve image aspect ratio with five hit targets: '+JSON.stringify(navGeometry));

 // Regression guard: inspect learning footer while the learning screen is visible.
 // CSS percentages on a hidden board cannot be resolved to screen pixels.
 const learningCss=await page.evaluate(()=>{
  const el=document.querySelector('#learning .learning-bottom-nav');
  const cs=getComputedStyle(el);
  return {image:cs.backgroundImage,size:cs.backgroundSize,buttons:el.querySelectorAll('button').length,
   left:cs.left,top:cs.top,width:cs.width,height:cs.height};
 });
 assert(learningCss.image.includes('ui-bottom-navigation.png')&&learningCss.size==='contain'&&learningCss.buttons===5,
  'learning footer must use the approved image and five buttons: '+JSON.stringify(learningCss));
 assert(learningCss.left==='6%'&&learningCss.top==='auto'&&learningCss.width==='88%'&&learningCss.height!=='18%',
  'learning footer positioning must match its single authoritative CSS: '+JSON.stringify(learningCss));
 await shot('gift-and-treasure');
 assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
 console.log('PASS: home, topics, countries, flag learning, capital learning, quiz BPM, 20 questions, result');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
