/* Stage 21: award one existing cultural treasure for a perfect quiz. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),KEY='countryTreasureCollection';
 const files=window.CountryV2RewardFiles||[];
 let eligible=[],selected=null,claimed=false,qualified=false;
 const parseFile=file=>{const match=file.match(/^(?:\d+[-_])?reward-([a-z]{2})-(.+)\.png$/i);return match?{file,code:match[1],name:match[2].replace(/-/g,' ')}:null};
 const items=files.map(parseFile).filter(Boolean);
 function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string'):[]}catch{return []}}
 function draw(){
  const grid=$('treasureRewardChoices');grid.replaceChildren();
  for(const item of eligible){const b=document.createElement('button');b.type='button';b.className='treasure-reward-option';b.dataset.treasureFile=item.file;b.setAttribute('aria-pressed',String(selected===item.file));const img=document.createElement('img');img.src='./assets/'+encodeURIComponent(item.file);img.alt=item.name;img.loading='lazy';const country=window.CountryV2Data.byCode(item.code);const name=document.createElement('strong');name.textContent=country?.country||item.code;const label=document.createElement('span');label.textContent=item.name;b.append(img,name,label);grid.append(b)}
  $('treasureRewardSave').disabled=!selected||claimed||!qualified;
  $('treasureRewardMessage').textContent=claimed?'선택한 보물을 도감에 저장했습니다.':eligible.length?'보물 하나를 선택하세요.':'해당 국가의 보물 이미지가 아직 등록되지 않았습니다.';
 }
 function prepare(data){
  qualified=data.score===data.total&&data.total===20&&data.percentage===100&&data.results?.length===20;
  const codes=new Set((data.results||[]).map(x=>x.source));
  eligible=qualified?items.filter(x=>codes.has(x.code)):[];
  selected=null;claimed=false;draw();
  $('resultReward').disabled=!qualified||eligible.length===0;
  $('resultReward').textContent=qualified&&eligible.length?'특별 보물 선택':'보상 없음';
 }
 document.addEventListener('country-v2:quiz-complete',e=>prepare(e.detail));
 $('resultReward').addEventListener('click',()=>{if(qualified&&eligible.length)window.CountryV2.go('quizReward')});
 $('treasureRewardChoices').addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('[data-treasure-file]'):null;if(!b||claimed)return;selected=b.dataset.treasureFile;draw()});
 $('treasureRewardSave').addEventListener('click',()=>{if(!qualified||claimed||!eligible.some(x=>x.file===selected))return;try{const saved=read();const code=eligible.find(x=>x.file===selected).code;if(!saved.some(x=>x===code||x.match(/^(?:\d+[-_])?reward-([a-z]{2})-/i)?.[1]===code))saved.push(code);localStorage.setItem(KEY,JSON.stringify(saved));claimed=true;draw();document.dispatchEvent(new CustomEvent('country-v2:treasure-earned',{detail:{file:selected}}))}catch(e){$('treasureRewardMessage').textContent='저장에 실패했습니다. 저장 공간을 확인해 주세요.';console.error(e)}});
})();
