/* Stage 22: flag collection from original localStorage key. */
(()=>{'use strict';
 const KEY='countryFlagCollection',list=document.getElementById('flagsCollection');
 const byCode=window.CountryV2Data.byCode;
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
 function render(){
  const saved=read();
  const codes=[...new Set(saved.map(x=>typeof x==='string'?x:(x&&typeof x==='object'?(x.flag||x.code):null)).filter(Boolean))];
  const countries=codes.map(byCode).filter(Boolean);
  list.replaceChildren();
  for(const item of countries){const card=document.createElement('article');card.className='flags-item';const image=document.createElement('img');image.src='https://flagcdn.com/w320/'+item.flag+'.png';image.alt=item.country+' 국기';image.loading='lazy';const name=document.createElement('strong');name.textContent=item.country;const region=document.createElement('span');region.textContent=item.continent;card.append(image,name,region);list.append(card)}
  document.getElementById('flagsSummary').textContent='모은 국기 '+countries.length+'개 / 전체 '+window.COUNTRY_V2_DATA.length+'개국';
  document.getElementById('flagsEmpty').hidden=countries.length>0;
 }
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='flags')render()});
 document.addEventListener('country-v2:flag-earned',render);
 window.CountryV2Flags=Object.freeze({render});
})();
