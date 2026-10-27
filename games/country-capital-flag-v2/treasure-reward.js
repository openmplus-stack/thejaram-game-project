/* Country V2: award one standard country treasure after a perfect 20-question quiz. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),KEY='countryTreasureCollection';
 const catalog=window.CountryV2TreasureCatalog;
 const items=(catalog?.base||[]).map(x=>({...x,name:x.file.replace(/^reward-[a-z]{2}-|\.png$/g,'').replace(/-/g,' ')}));
 const asset=file=>'./assets/rewards/'+encodeURIComponent(file);
 let eligible=[],selected=null,claimed=false,qualified=false;
 function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string'):[]}catch{return []}}
 function draw(){
  const grid=$('treasureRewardChoices');grid.replaceChildren();
  for(const item of eligible){const b=document.createElement('button');b.type='button';b.className='treasure-reward-option';b.dataset.treasureFile=item.file;b.setAttribute('aria-pressed',String(selected===item.file));const img=document.createElement('img');img.src=asset(item.file);img.alt=item.name;img.loading='lazy';const name=document.createElement('strong');name.textContent=item.country;const label=document.createElement('span');label.textContent=item.name;b.append(img,name,label);grid.append(b)}
  $('treasureRewardSave').disabled=!selected||claimed||!qualified;
  $('treasureRewardMessage').textContent=claimed?'선택한 보물을 도감에 저장했습니다.':eligible.length?'보물 하나를 선택하세요.':'해당 국가의 기본 보물이 등록되지 않았습니다.';
 }
 function prepare(data){
  qualified=data.score===data.total&&data.total===20&&data.percentage===100&&data.results?.length===20;
  const codes=new Set((data.results||[]).map(x=>x.source));
  eligible=qualified?items.filter(x=>codes.has(x.code)):[];
  selected=null;claimed=false;draw();
  $('resultReward').disabled=!qualified||eligible.length===0;
  $('resultReward').textContent=qualified&&eligible.length?'기본 보물 선택':'보상 없음';
 }
 document.addEventListener('country-v2:quiz-complete',e=>prepare(e.detail));
 $('resultReward').addEventListener('click',()=>{if(qualified&&eligible.length)window.CountryV2.go('quizReward')});
 $('treasureRewardChoices').addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-treasure-file]'):null;if(!b||claimed)return;selected=b.dataset.treasureFile;draw()});
 $('treasureRewardSave').addEventListener('click',()=>{if(!qualified||claimed||!eligible.some(x=>x.file===selected))return;try{const saved=read();if(!saved.includes(selected))saved.push(selected);localStorage.setItem(KEY,JSON.stringify(saved));claimed=true;draw();document.dispatchEvent(new CustomEvent('country-v2:treasure-earned',{detail:{file:selected}}))}catch(e){$('treasureRewardMessage').textContent='저장에 실패했습니다. 저장 공간을 확인해 주세요.';console.error(e)}});
})();
