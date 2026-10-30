/* Stage 24: local learning history; no remote transmission. */
(()=>{'use strict';
 const KEY='countryV2Progress',MAX=100,$=id=>document.getElementById(id);
 function json(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v===null?fallback:v}catch{return fallback}}
 function initial(){return {version:1,learned:[],quizzes:[],history:[]}}
 function load(){const v=json(KEY,initial());return v&&Array.isArray(v.learned)&&Array.isArray(v.quizzes)&&Array.isArray(v.history)?v:initial()}
 function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(e){console.warn('[V2] Progress could not be saved',e);return false}}
 function append(type,detail){
  const data=load(),at=new Date().toISOString();
  if(type==='learning'){
   data.learned=[...new Set([...data.learned,...detail.countries])];
   data.history.unshift({type,at,count:detail.countries.length,topic:detail.topic});
  }else{
   data.quizzes.push({at,score:detail.score,total:detail.total,percentage:detail.percentage,topic:detail.topic});
   data.quizzes=data.quizzes.slice(-MAX);
   data.history.unshift({type,at,score:detail.score,total:detail.total,percentage:detail.percentage,topic:detail.topic});
  }
  data.history=data.history.slice(0,MAX);save(data);
 }
 function collectionCount(key){const v=json(key,[]);return Array.isArray(v)?new Set(v.map(x=>typeof x==='string'?x:x?.flag||x?.code).filter(Boolean)).size:0}
 function treasureCount(){const v=json('countryTreasureCollection',[]);return Array.isArray(v)?new Set(v.filter(x=>typeof x==='string').map(x=>x.match(/^(?:\d+[-_])?reward-([a-z]{2})-/i)?.[1]||x)).size:0}
 function render(){
  const data=load(),n=data.quizzes.length;
  $('progressLearned').textContent=data.learned.length;
  $('progressQuizRuns').textContent=n;
  $('progressAverage').textContent=n?Math.round(data.quizzes.reduce((sum,x)=>sum+x.percentage,0)/n)+'%':'—';
  $('progressFlags').textContent=collectionCount('countryFlagCollection');
  $('progressTreasures').textContent=treasureCount();
  const list=$('progressHistory');list.replaceChildren();
  for(const item of data.history.slice(0,20)){
   const li=document.createElement('li'),date=new Date(item.at);
   const label=Number.isNaN(date.getTime())?'날짜 미상':date.toLocaleDateString('ko-KR');
   const topic=item.topic==='flag-country'?'나라·국기':'나라·수도';
   li.textContent=item.type==='learning'?label+' · '+topic+' 학습 '+item.count+'개국 완료':label+' · '+topic+' 문제 '+item.score+'/'+item.total+'개 정답 ('+item.percentage+'%)';
   list.append(li);
  }
  $('progressEmpty').hidden=data.history.length>0;
 }
 document.addEventListener('country-v2:learning-complete',e=>append('learning',e.detail));
 document.addEventListener('country-v2:quiz-complete',e=>append('quiz',e.detail));
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='progress')render()});
 document.addEventListener('country-v2:flag-earned',()=>{if(window.CountryV2.screen==='progress')render()});
 document.addEventListener('country-v2:treasure-earned',()=>{if(window.CountryV2.screen==='progress')render()});
 window.CountryV2Progress=Object.freeze({render,load});
})();
