/* Stage 19: result view and per-question review. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 let last=null;
 const names=new Map((window.COUNTRY_V2_DATA||[]).map(x=>[x.flag,x]));
 function render(data){
  last=data;
  $('resultPercentage').textContent=data.percentage+'%';
  $('resultCount').textContent=data.score+' / '+data.total+'문제 정답';
  $('resultMessage').textContent=data.percentage===100?'모든 문제를 맞혔어요!':data.percentage>=80?'아주 잘했어요!':data.percentage>=50?'좋아요! 틀린 문제를 다시 살펴봐요.':'조금씩 연습하면 더 잘할 수 있어요.';
  const list=$('resultDetails');list.replaceChildren();
  for(const x of data.results){
   const li=document.createElement('li');
   li.className=x.correct?'result-right':'result-incorrect';
   const source=names.get(x.source),partner=names.get(x.partner);
   const pair=data.topic==='flag-country'?(partner?.country||x.partner)+' 국기':(partner?.capital||'수도 정보 없음');
   const expected=x.expected?'O':'X',given=x.answer?'O':'X';
   li.textContent=x.question+'번 · '+(source?.country||x.source)+' ↔ '+pair+' · '+(x.correct?'정답':'오답')+' (선택 '+given+', 정답 '+expected+')';
   list.append(li);
  }
 }
 document.addEventListener('country-v2:quiz-complete',e=>{render(e.detail);window.CountryV2.go('result')});
 $('resultRetry').addEventListener('click',()=>{if(last)window.CountryV2.go('quiz')});
 window.CountryV2Result=Object.freeze({get latest(){return last}});
})();
