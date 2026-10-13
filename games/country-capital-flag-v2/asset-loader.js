/* V2 asset loader: failure must never block navigation. */
(()=>{'use strict';
 const original='../country-capital-flag/assets/';
 const registry=Object.freeze({
  home:'./assets/home-approved-composite.png',
  logo:original+'backgrounds/logo-world-buddy.png',
  continent:original+'backgrounds/continent-select-no-number.png',
  topic:original+'backgrounds/topic-select-no-number-no-arrows.png',
  activities:original+'backgrounds/bg-mode-select.png',
  countries:original+'backgrounds/bg-country-select.png',
  learning:original+'backgrounds/bg-learning.png',
  quiz:original+'backgrounds/bg-quiz.png',
  result:original+'backgrounds/bg-result.png',
  reward:original+'backgrounds/bg-reward.png',
  learnReward:original+'backgrounds/bg-reward.png',
  quizReward:original+'backgrounds/bg-reward.png',
  flags:original+'backgrounds/bg-world-common.png',
  treasures:original+'backgrounds/bg-world-common.png',
  progress:original+'backgrounds/bg-world-common.png',
  explorer:original+'characters/explorer-master.png'
 });
 const status=new Map();
 function load(key,{timeout=7000}={}){
  if(!Object.hasOwn(registry,key))return Promise.resolve(false);
  if(status.has(key))return status.get(key);
  const promise=new Promise(resolve=>{
   const image=new Image();let settled=false;
   const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve(ok)};
   const timer=setTimeout(()=>finish(false),timeout);
   image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=registry[key];
  });
  status.set(key,promise);return promise;
 }
 async function background(key,element){
  if(!element)return false;
  const ok=await load(key);
  if(ok){element.style.backgroundImage='url("'+registry[key]+'")';element.dataset.assetState='ready'}
  else{element.dataset.assetState='fallback';console.warn('[country-v2] Background unavailable:',key)}
  return ok;
 }
 document.addEventListener('error',event=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement))return;
  if(img.dataset.assetFallback==='shown')return;
  img.dataset.assetFallback='shown';
  img.hidden=true;
  const fallback=document.createElement('span');
  fallback.className='asset-fallback';
  fallback.textContent=img.alt||'이미지를 표시할 수 없습니다';
  fallback.setAttribute('role','img');
  fallback.setAttribute('aria-label',img.alt||'이미지를 표시할 수 없습니다');
  img.insertAdjacentElement('afterend',fallback);
 },true);
 document.addEventListener('country-v2:navigate',event=>{
  const key=event.detail.to==='continents'?'continent':event.detail.to==='topics'?'topic':event.detail.to;
  if(Object.hasOwn(registry,key))background(key,key==='continent'?document.getElementById('continentArtboard'):key==='topic'?document.getElementById('topicArtboard'):key==='countries'?document.getElementById('countryArtboard'):key==='activities'?document.getElementById('activityArtboard'):document.getElementById(key));
 });
 background('home',document.getElementById('homeArtboard'));
 window.CountryV2Assets=Object.freeze({registry,load,background});
})();