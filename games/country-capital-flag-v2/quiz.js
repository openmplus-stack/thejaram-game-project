/* Stage 17: 20-question O/X quiz, deterministic constraints and session results. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const COUNT=20;
 let questions=[],index=0,correct=0,answered=false,results=[],active=false;
 const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 function build(){
  const selection=window.CountryV2.selection;
  const pool=window.CountryV2Data.byCodes(selection.countries);
  if(!pool.length)return [];
  const order=shuffle(pool);
  const canMismatch=pool.length>1;
  const output=[];
  for(let i=0;i<COUNT;i++){
   const source=order[i%order.length];
   const matching=!canMismatch||i%2===0;
   const alternatives=pool.filter(x=>x.flag!==source.flag);
   const partner=matching?source:alternatives[Math.floor(Math.random()*alternatives.length)];
   output.push({source,partner,matching,topic:selection.topic});
  }
  return output;
 }
 function display(){
  const q=questions[index];if(!q)return;
  $('quizProgress').textContent=(index+1)+' / '+COUNT;
  $('quizScore').textContent='정답 '+correct+'개';
  $('quizLeftText').textContent=q.source.country;
  $('quizLeftFlag').hidden=true;
  if(q.topic==='flag-country'){
   $('quizRightText').textContent='';
   $('quizRightFlag').src='https://flagcdn.com/w320/'+q.partner.flag+'.png';
   $('quizRightFlag').alt=q.partner.country+' 국기';
   $('quizRightFlag').hidden=false;
  }else{
   $('quizRightFlag').hidden=true;
   $('quizRightText').textContent=q.partner.capital;
  }
  answered=false;$('quizFeedback').textContent='';$('quizFeedback').className='';
  $('quizYes').disabled=false;$('quizNo').disabled=false;$('quizAdvance').hidden=true;
 }
 function begin(){questions=build();index=0;correct=0;results=[];answered=false;active=questions.length>0;if(active)display();else $('quizFeedback').textContent='먼저 국가를 선택하세요.'}
 function answer(value){
  if(!active||answered)return;
  const q=questions[index],ok=value===q.matching;
  answered=true;if(ok)correct++;
  results.push({question:index+1,source:q.source.flag,partner:q.partner.flag,expected:q.matching,answer:value,correct:ok});
  $('quizScore').textContent='정답 '+correct+'개';
  $('quizFeedback').textContent=ok?'정답이에요!':'다시 확인해 보세요. '+(q.matching?'맞는 짝입니다.':'서로 다른 짝입니다.');
  $('quizFeedback').className=ok?'quiz-correct':'quiz-wrong';
  $('quizYes').disabled=true;$('quizNo').disabled=true;
  $('quizAdvance').hidden=false;
  $('quizAdvance').textContent=index===COUNT-1?'결과 확인':'다음 문제 →';
 }
 function advance(){
  if(!active||!answered)return;
  if(index<COUNT-1){index++;display();return}
  active=false;
  $('quizAdvance').hidden=true;
  $('quizFeedback').textContent='20문제를 모두 풀었습니다. '+correct+' / '+COUNT+'개 정답';
  document.dispatchEvent(new CustomEvent('country-v2:quiz-complete',{detail:{score:correct,total:COUNT,percentage:Math.round(correct/COUNT*100),results:[...results],countries:window.CountryV2.selection.countries,topic:window.CountryV2.selection.topic}}));
 }
 $('quizYes').addEventListener('click',()=>answer(true));
 $('quizNo').addEventListener('click',()=>answer(false));
 $('quizAdvance').addEventListener('click',advance);
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='quiz')begin();else if(e.detail.from==='quiz')active=false});
 window.CountryV2Quiz=Object.freeze({get progress(){return {index,correct,total:COUNT,answered,active}},restart:begin});
})();
