/* Stage 16: ten-country learning flow, selected data only. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 let session=[],position=0,finished=false;
 function speak(){if(!session.length||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const item=session[position];const mode=window.CountryV2.selection.topic;const text=mode==='flag-country'?item.country+'의 국기입니다.':item.country+'의 수도는 '+item.capital+'입니다.';const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.85;window.speechSynthesis.speak(u)}
 function render(){if(!session.length)return;const item=session[position],mode=window.CountryV2.selection.topic;$('learningCount').textContent=(position+1)+' / '+session.length;$('learningMode').textContent=mode==='flag-country'?'나라와 국기':'나라와 수도';$('learningFlag').src='https://flagcdn.com/w320/'+item.flag+'.png';$('learningFlag').alt=item.country+' 국기';$('learningCountry').textContent=item.country;$('learningCapital').textContent=mode==='country-capital'?'수도: '+item.capital:'';$('learningPrev').disabled=position===0;$('learningNext').textContent=position===session.length-1?'학습 완료':'다음 나라 →';$('learningNotice').textContent='';}
 function begin(){const selection=window.CountryV2.selection;session=window.CountryV2Data.byCodes(selection.countries).slice(0,10);position=0;finished=false;if(!session.length){$('learningNotice').textContent='선택한 나라가 없습니다.';return}render();speak()}
 function complete(){if(finished)return;finished=true;window.speechSynthesis?.cancel();$('learningNotice').textContent='학습을 완료했습니다! '+session.length+'개 나라를 살펴보았습니다.';$('learningNext').disabled=true;document.dispatchEvent(new CustomEvent('country-v2:learning-complete',{detail:{countries:session.map(x=>x.flag),topic:window.CountryV2.selection.topic}}))}
 $('learningPrev').addEventListener('click',()=>{if(position>0){position--;render();speak()}});
 $('learningNext').addEventListener('click',()=>{if(finished)return;if(position<session.length-1){position++;render();speak()}else complete()});
 $('learningSpeak').addEventListener('click',speak);
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='learning')begin();else if(e.detail.from==='learning')window.speechSynthesis?.cancel()});
})();
