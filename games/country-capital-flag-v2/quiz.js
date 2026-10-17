/* Stage 17: 20-question O/X quiz, deterministic constraints and session results. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const COUNT=20;
 let questions=[],index=0,correct=0,answered=false,results=[],active=false,advanceTimer=null;
 let audioContext=null,metroTimer=null,beat=0,metroRunning=false,metroSoundOn=true;
 function cancelAdvance(){if(advanceTimer!==null)clearTimeout(advanceTimer);advanceTimer=null}
 function stopMetro(){if(metroTimer!==null)clearInterval(metroTimer);metroTimer=null;metroRunning=false;$('quizMetroToggle').textContent='▶';$('quizMetroToggle').setAttribute('aria-pressed','false');document.querySelectorAll('.quiz-beats span').forEach(x=>x.classList.remove('on'))}
 function tick(){if(!active){stopMetro();return}beat=(beat%4)+1;document.querySelectorAll('.quiz-beats span').forEach((x,i)=>x.classList.toggle('on',i===((beat-1)*2)||i===((beat-1)*2+1)));if(metroSoundOn)toneBeat(beat===1);}
 function toneBeat(accent){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioContext ||=new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const t=audioContext.currentTime,o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=accent?880:620;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.055,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.075);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.08)}catch{}}
 function startMetro(){stopMetro();if(!active)return;metroRunning=true;beat=0;$('quizMetroToggle').textContent='Ⅱ';$('quizMetroToggle').setAttribute('aria-pressed','true');tick();metroTimer=setInterval(tick,60000/Number($('quizBpm').value||60))}

 function speak(){if(!('speechSynthesis' in window)||!questions[index])return;window.speechSynthesis.cancel();const q=questions[index],part=q.topic==='flag-country'?q.partner.country+' 국기':q.partner.capital;const u=new SpeechSynthesisUtterance(q.source.country+'와 '+part+'는 서로 맞는 짝일까요?');u.lang='ko-KR';u.rate=.88;window.speechSynthesis.speak(u)}
 function tone(ok){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioContext ||= new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const now=audioContext.currentTime;const notes=ok?[660,880]:[330,220];notes.forEach((hz,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),start=now+i*.12;osc.type=ok?'sine':'triangle';osc.frequency.setValueAtTime(hz,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.13,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.18);osc.connect(gain);gain.connect(audioContext.destination);osc.start(start);osc.stop(start+.19)})}catch(e){console.warn('[V2] Sound unavailable',e)}}
 function clearFeedback(){const board=document.querySelector('#quiz .quiz-board');board.classList.remove('answer-correct','answer-wrong');document.querySelectorAll('#quiz .quiz-pair>.quiz-tile').forEach(tile=>{tile.style.removeProperty('background');tile.style.removeProperty('background-color');tile.style.removeProperty('border-color');tile.style.removeProperty('box-shadow')});$('quizYes').classList.remove('answer-picked');$('quizNo').classList.remove('answer-picked')}

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
  cancelAdvance();const q=questions[index];if(!q)return;
  $('quizProgress').textContent=(index+1)+' / '+COUNT;
  $('quizScore').textContent='정답 '+correct+'개';
  $('quizLeftText').textContent=q.topic==='flag-country'?'':q.source.country;
  $('quizLeftFlag').hidden=q.topic!=='flag-country';
  $('quizRightFlag').hidden=true;
  if(q.topic==='flag-country'){
   $('quizLeftFlag').src='https://flagcdn.com/w320/'+q.source.flag+'.png';
   $('quizLeftFlag').alt=q.source.country+' 국기';
   $('quizRightText').textContent=q.partner.country;
  }else{
   $('quizRightText').textContent=q.partner.capital;
  }
  answered=false;clearFeedback();$('quizFeedback').textContent='';$('quizFeedback').className='';
  $('quizYes').disabled=false;$('quizNo').disabled=false;$('quizAdvance').hidden=true;
 }
 function begin(){cancelAdvance();stopMetro();questions=build();index=0;correct=0;results=[];answered=false;active=questions.length>0;if(active)display();else $('quizFeedback').textContent='먼저 국가를 선택하세요.'}
 function answer(value){
  if(!active||answered)return;
  const q=questions[index],ok=value===q.matching;
  answered=true;if(ok)correct++;
  clearFeedback();document.querySelector('#quiz .quiz-board').classList.add(ok?'answer-correct':'answer-wrong');document.querySelectorAll('#quiz .quiz-pair>.quiz-tile').forEach(tile=>{tile.style.setProperty('background',ok?'#b9f49c':'#ff7777','important');tile.style.setProperty('background-color',ok?'#b9f49c':'#ff7777','important');tile.style.setProperty('border-color',ok?'#389a39':'#b72222','important')});(value?$('quizYes'):$('quizNo')).classList.add('answer-picked');tone(ok);
  results.push({question:index+1,source:q.source.flag,partner:q.partner.flag,expected:q.matching,answer:value,correct:ok});
  $('quizScore').textContent='정답 '+correct+'개';
  $('quizFeedback').textContent=ok?'정답이에요!':'다시 확인해 보세요. '+(q.matching?'맞는 짝입니다.':'서로 다른 짝입니다.');
  $('quizFeedback').className=ok?'quiz-correct':'quiz-wrong';
  $('quizYes').disabled=true;$('quizNo').disabled=true;
  advanceTimer=setTimeout(()=>{advanceTimer=null;advance()},1000);
 }
 function advance(){
  if(!active||!answered)return;
  cancelAdvance();
  if(index<COUNT-1){index++;display();return}
  active=false;stopMetro();
  $('quizAdvance').hidden=true;
  $('quizFeedback').textContent='20문제를 모두 풀었습니다. '+correct+' / '+COUNT+'개 정답';
  document.dispatchEvent(new CustomEvent('country-v2:quiz-complete',{detail:{score:correct,total:COUNT,percentage:Math.round(correct/COUNT*100),results:[...results],countries:window.CountryV2.selection.countries,topic:window.CountryV2.selection.topic}}));
 }
 $('quizYes').addEventListener('click',()=>answer(true));
 $('quizNo').addEventListener('click',()=>answer(false));

 $('quizBpmMinus').addEventListener('click',()=>changeBpm(-1));
 $('quizBpmPlus').addEventListener('click',()=>changeBpm(1));
 $('quizSpeak').addEventListener('click',speak);
 $('quizMetroSound').addEventListener('click',()=>{metroSoundOn=!metroSoundOn;const b=$('quizMetroSound');b.textContent=metroSoundOn?'🔊':'🔇';b.setAttribute('aria-pressed',String(metroSoundOn));});
 function changeBpm(step){const sel=$('quizBpm');sel.selectedIndex=Math.max(0,Math.min(sel.options.length-1,sel.selectedIndex+step));sel.dispatchEvent(new Event('change'))}
 $('quizMetroToggle').addEventListener('click',()=>metroRunning?stopMetro():startMetro());
 $('quizBpm').addEventListener('change',()=>{if(metroRunning)startMetro()});
 document.addEventListener('country-v2:navigate',e=>{if(e.detail.to==='quiz')begin();else if(e.detail.from==='quiz'){active=false;cancelAdvance();stopMetro()}});
 window.CountryV2Quiz=Object.freeze({get progress(){return {index,correct,total:COUNT,answered,active}},restart:begin});
})();
