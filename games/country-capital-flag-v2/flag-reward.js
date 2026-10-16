/* Award all selected flags after completing the entire learning session.
   Preserve the original countryFlagCollection storage key and legacy entry formats. */
(()=>{'use strict';
 const KEY='countryFlagCollection';
 const $=id=>document.getElementById(id);
 function normalize(raw){return [...new Set(raw.map(x=>typeof x==='string'?x:x&&typeof x==='object'?(x.flag||x.code):null).filter(code=>window.CountryV2Data.byCode(code)))]}
 function award(codes){
  const valid=normalize(codes);
  const raw=localStorage.getItem(KEY);
  const previous=raw===null?[]:JSON.parse(raw);
  if(!Array.isArray(previous))throw new Error('Invalid existing flag collection');
  const owned=normalize(previous);
  const newCodes=valid.filter(code=>!owned.includes(code));
  // Only write if there is a change; verify persistence before claiming success.
  if(newCodes.length){const updated=[...owned,...newCodes];localStorage.setItem(KEY,JSON.stringify(updated));const check=localStorage.getItem(KEY);if(!check||!updated.every(code=>normalize(JSON.parse(check)).includes(code)))throw new Error('Flag reward persistence failed')}
  return {newCodes,total:owned.length+newCodes.length};
 }
 document.addEventListener('country-v2:learning-complete',e=>{
  const codes=Array.isArray(e.detail?.countries)?e.detail.countries:[];
  try{
   const result=award(codes);
   const message=result.newCodes.length?'학습 완료! 새로운 국기 '+result.newCodes.length+'개를 획득했어요!':'학습 완료! 이미 모은 국기예요. 다시 공부했어요!';
   $('learningNotice').textContent=message;
   document.dispatchEvent(new CustomEvent('country-v2:flag-earned',{detail:{flags:result.newCodes,total:result.total}}));
  }catch(error){console.error('[country-v2] Flag reward save failed:',error);$('learningNotice').textContent='국기를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'}
 });
})();
