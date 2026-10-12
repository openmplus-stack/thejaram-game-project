/* 세계 짝꿍 찾기 V2: 단일 화면 전환 엔진 (7단계) */
(()=>{'use strict';
 const screens=new Map([...document.querySelectorAll('main#app > section.screen')].map(el=>[el.id,el]));
 const state={current:'home',history:[],continent:null,topic:null,filter:'all',selected:new Set()};
 const continents=['아시아','유럽','아프리카','북아메리카','남아메리카','오세아니아','전체'];
 const choices=document.getElementById('continentChoices');
 for(const name of continents){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.continent=name;b.className='continent-choice continent-'+(['asia','europe','africa','north','south','oceania','all'][continents.indexOf(name)]);choices.appendChild(b)}
 function show(id,{remember=true}={}){
  if(!screens.has(id)) {console.warn('[V2] Unknown screen:',id);return false}
  if(id===state.current)return true;
  const from=state.current;
  if(remember)state.history.push(from);
  for(const [key,el] of screens){const active=key===id;el.classList.toggle('active',active);el.hidden=!active;el.setAttribute('aria-hidden',String(!active))}
  state.current=id;
  if(id==='countries')window.CountryV2Countries?.render();
  if(id==='activities'){const label=document.getElementById('activitySummary');if(label)label.textContent=(state.continent||'전체')+' · '+state.selected.size+'개국 선택 · '+(state.topic==='flag-country'?'나라와 국기':'나라와 수도');}
  window.scrollTo?.(0,0);
  document.dispatchEvent(new CustomEvent('country-v2:navigate',{detail:{from,to:id}}));
  return true;
 }
 function back(){const previous=state.history.pop();return show(previous&&screens.has(previous)?previous:'home',{remember:false})}
 function home(){state.history.length=0;return show('home',{remember:false})}
 function handleClick(event){
  const button=event.target.closest('button');
  if(!button||!document.getElementById('app').contains(button)||button.disabled)return;
  if(button.hasAttribute('data-back')){back();return}
  const destination=button.dataset.go;
  if(destination){if((destination==='activities'||destination==='learning'||destination==='quiz')&&state.selected.size===0){console.warn('[V2] No countries selected');return}destination==='home'?home():show(destination);return}
  if(button.dataset.continent){state.continent=button.dataset.continent;state.selected.clear();state.filter='all';show('topics');return}
  if(button.dataset.topic){state.topic=button.dataset.topic;show('countries');return}
  if(window.CountryV2Countries?.handle(button))return
 }
 document.getElementById('app').addEventListener('click',handleClick);
 for(const [id,el] of screens){const active=id==='home';el.classList.toggle('active',active);el.hidden=!active;el.setAttribute('aria-hidden',String(!active))}
 window.addEventListener('error',e=>console.error('[country-v2]',e.message));
 window.CountryV2=Object.freeze({get screen(){return state.current},get selection(){return {continent:state.continent,topic:state.topic,countries:[...state.selected]}},go:show,back,home,get state(){return state}});
})();