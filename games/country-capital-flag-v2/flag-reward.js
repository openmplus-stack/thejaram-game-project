/* Stage 20: one flag reward per completed learning session. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const KEY='countryFlagCollection';
 let eligible=[],chosen=null,claimed=false;
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
 function show(){const grid=$('flagRewardChoices');grid.replaceChildren();for(const item of eligible){const button=document.createElement('button');button.type='button';button.className='flag-reward-option';button.dataset.rewardFlag=item.flag;button.setAttribute('aria-pressed',String(chosen===item.flag));const img=document.createElement('img');img.src='https://flagcdn.com/w160/'+item.flag+'.png';img.alt=item.country+' 국기';const label=document.createElement('strong');label.textContent=item.country;button.append(img,label);grid.append(button)}$('flagRewardSave').disabled=!chosen||claimed;$('flagRewardMessage').textContent=claimed?'국기가 보관함에 저장되었습니다.':eligible.length?'국기 한 개를 선택해 주세요.':'보상 가능한 국기가 없습니다.'}
 document.addEventListener('country-v2:learning-complete',e=>{eligible=window.CountryV2Data.byCodes(e.detail.countries);chosen=null;claimed=false;show();window.CountryV2.go('learnReward')});
 $('flagRewardChoices').addEventListener('click',e=>{const button=e.target.closest('button[data-reward-flag]');if(!button||claimed)return;chosen=button.dataset.rewardFlag;show()});
 $('flagRewardSave').addEventListener('click',()=>{if(!chosen||claimed||!eligible.some(x=>x.flag===chosen))return;try{const saved=read();if(!saved.includes(chosen))saved.push(chosen);localStorage.setItem(KEY,JSON.stringify(saved));claimed=true;show();document.dispatchEvent(new CustomEvent('country-v2:flag-earned',{detail:{flag:chosen}}))}catch(e){$('flagRewardMessage').textContent='저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';console.error(e)}});
})();
