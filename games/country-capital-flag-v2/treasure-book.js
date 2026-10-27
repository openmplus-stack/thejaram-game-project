/* Country V2: 195 standard treasures; event items are separate from completion. */
(()=>{'use strict';
 const KEY='countryTreasureCollection',GOAL=195;
 const $=id=>document.getElementById(id),catalog=window.CountryV2TreasureCatalog;
 const entries=(catalog?.base||[]).map(x=>({...x,name:x.file.replace(/^reward-[a-z]{2}-|\.png$/g,'').replace(/-/g,' ')}));
 const eventFiles=new Set(catalog?.event||[]);
 const legacy=file=>file.replace(/^\d+[-_]/,'').replace(/^reward-uk-/,'reward-gb-');
 function owned(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string').map(legacy):[])}catch{return new Set()}}
 function render(){
  const collection=owned(),grid=$('treasureBookGrid');grid.replaceChildren();
  const collected=entries.filter(x=>collection.has(x.file)||collection.has(x.code));
  for(const entry of collected){
   const item=document.createElement('article');item.className='treasure-book-item is-owned';
   const image=document.createElement('img');image.loading='lazy';image.alt=entry.name;image.src='./assets/rewards/'+encodeURIComponent(entry.file);
   image.addEventListener('error',()=>{console.warn('[country-v2] Missing treasure asset:',entry.file);image.hidden=true});
   const country=document.createElement('strong');country.textContent=entry.country;
   const name=document.createElement('span');name.textContent=entry.name;
   item.append(image,country,name);grid.append(item);
  }
  $('treasureBookSummary').textContent='모은 기본 보물 '+collected.length+'개 / 전체 '+GOAL+'개';
  $('treasureBookEmpty').hidden=collected.length>0;
 }
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='treasures')render()});
 document.addEventListener('country-v2:treasure-earned',render);
 window.CountryV2TreasureBook=Object.freeze({render,get available(){return entries.length},get eventAvailable(){return eventFiles.size}});
})();
