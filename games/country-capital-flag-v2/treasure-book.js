/* Treasure gallery: render only collected item IDs; preserve existing reward storage. */
(()=>{'use strict';
 const KEY='countryTreasureCollection',GOAL=180;
 const $=id=>document.getElementById(id);
 const entries=(window.CountryV2RewardFiles||[]).map(file=>{
  const m=file.match(/^(?:\d+[-_])?reward-([a-z]{2})-(.+)\.png$/i);
  if(!m)return null;
  const country=window.CountryV2Data.byCode(m[1]);
  return {file,code:m[1],name:m[2].replace(/-/g,' '),country:country?.country||m[1].toUpperCase(),continent:country?.continent||'기타'};
 }).filter(Boolean);
 function owned(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[])}catch{return new Set()}}
 function render(){
  const collection=owned(),grid=$('treasureBookGrid');grid.replaceChildren();
  // A reward is identified by its unique filename; legacy country-code records remain readable.
  const collected=entries.filter(x=>collection.has(x.file)||collection.has(x.code));
  for(const entry of collected){
   const item=document.createElement('article');item.className='treasure-book-item is-owned';
   const image=document.createElement('img');image.loading='lazy';image.alt=entry.name;image.src='../country-capital-flag/assets/rewards/'+encodeURIComponent(entry.file);
   image.addEventListener('error',()=>{console.warn('[country-v2] Missing treasure asset:',entry.file);image.hidden=true});
   const country=document.createElement('strong');country.textContent=entry.country;
   const name=document.createElement('span');name.textContent=entry.name;
   item.append(image,country,name);grid.append(item);
  }
  $('treasureBookSummary').textContent='모은 보물 '+collected.length+'개 / 전체 '+GOAL+'개';
  $('treasureBookEmpty').hidden=collected.length>0;
 }
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='treasures')render()});
 document.addEventListener('country-v2:treasure-earned',render);
 window.CountryV2TreasureBook=Object.freeze({render,get available(){return entries.length}});
})();
