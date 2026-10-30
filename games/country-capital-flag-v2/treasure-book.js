/* Stage 23: world treasure catalog, using verified available reward assets. */
(()=>{'use strict';
 const KEY='countryTreasureCollection';
 const $=id=>document.getElementById(id);
 const entries=(window.CountryV2RewardFiles||[]).map(file=>{const m=file.match(/^(?:\d+[-_])?reward-([a-z]{2})-(.+)\.png$/i);if(!m)return null;const country=window.CountryV2Data.byCode(m[1]);return {file,code:m[1],name:m[2].replace(/-/g,' '),country:country?.country||m[1].toUpperCase(),continent:country?.continent||'기타'}}).filter(Boolean);
 const continents=[...new Set(entries.map(x=>x.continent))];
 for(const name of continents){const option=document.createElement('option');option.value=name;option.textContent=name;$('treasureBookContinent').append(option)}
 function owned(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(saved)?saved.filter(x=>typeof x==='string').map(x=>x.match(/^(?:\d+[-_])?reward-([a-z]{2})-/i)?.[1]||x):[])}catch{return new Set()}}
 function render(){
  const collection=owned(),mode=$('treasureBookFilter').value,continent=$('treasureBookContinent').value;
  const count=entries.filter(x=>collection.has(x.file)||collection.has(x.code)).length;
  $('treasureBookSummary').textContent='획득 '+count+'개 / 현재 등록된 보물 '+entries.length+'개 · 전체 195개국';
  const grid=$('treasureBookGrid');grid.replaceChildren();let visible=0;
  for(const entry of entries){
   const has=collection.has(entry.file)||collection.has(entry.code);
   if(mode==='owned'&&!has||mode==='locked'&&has||continent!=='all'&&continent!==entry.continent)continue;
   visible++;
   const card=document.createElement('article');card.className='treasure-book-item '+(has?'is-owned':'is-locked');
   const image=document.createElement('img');image.loading='lazy';image.alt=has?entry.name:'획득 전 보물';image.src='./assets/'+encodeURIComponent(entry.file);
   const country=document.createElement('strong');country.textContent=entry.country;
   const name=document.createElement('span');name.textContent=has?entry.name:'미획득 보물';
   const status=document.createElement('small');status.textContent=has?'획득 완료':'🔒 아직 미획득';
   card.append(image,country,name,status);grid.append(card);
  }
  $('treasureBookEmpty').hidden=visible>0;
 }
 $('treasureBookFilter').addEventListener('change',render);
 $('treasureBookContinent').addEventListener('change',render);
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='treasures')render()});
 document.addEventListener('country-v2:treasure-earned',render);
 window.CountryV2TreasureBook=Object.freeze({render,get available(){return entries.length}});
})();
