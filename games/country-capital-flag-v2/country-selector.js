/* Stage 12: independent country selector; original data and storage keys. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const data=window.CountryV2Data;
 const state=window.CountryV2.state;
 function savedArray(key){try{const v=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(v)?v:[]}catch{return []}}
 function learned(){const codes=new Set();try{const v=JSON.parse(localStorage.getItem('countryStudyStats')||'{}');if(Array.isArray(v.learned))v.learned.forEach(x=>codes.add(x))}catch{}try{const v=JSON.parse(localStorage.getItem('countryV2Progress')||'{}');if(Array.isArray(v.learned))v.learned.forEach(x=>codes.add(x))}catch{}return codes}
 function pool(){return data.byContinent(state.continent)}
 function visible(){const base=pool(),done=learned(),review=new Set(savedArray('countryReviewList'));if(state.filter==='new')return base.filter(x=>!done.has(x.flag));if(state.filter==='learned')return base.filter(x=>done.has(x.flag));if(state.filter==='review')return base.filter(x=>review.has(x.flag));return base}
 function render(){
  const grid=$('countryChoices');grid.replaceChildren();
  const items=visible();
  for(const item of items){
   const button=document.createElement('button');button.type='button';button.className='country-card';button.dataset.countryCode=item.flag;button.setAttribute('aria-pressed',String(state.selected.has(item.flag)));
   const flag=document.createElement('img');flag.src='https://flagcdn.com/w80/'+encodeURIComponent(item.flag)+'.png';flag.alt=item.country+' 국기';flag.loading='lazy';
   const label=document.createElement('span');label.textContent=item.country;button.append(flag,label);grid.append(button);
  }
  $('countrySelectedCount').textContent=state.selected.size+'개 선택';
  $('countryNext').disabled=state.selected.size===0;
  $('countryMessage').textContent=(state.continent||'대륙')+' · '+items.length+'개국 표시';
  document.querySelectorAll('#countries [data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===state.filter)));
 }
 function handle(button){
  if(button.dataset.filter){state.filter=button.dataset.filter;render();return true}
  if(button.id==='countrySelectAll'){for(const x of visible())state.selected.add(x.flag);render();return true}
  if(button.id==='countryClearAll'){for(const x of visible())state.selected.delete(x.flag);render();return true}
  if(button.dataset.countryCode){const code=button.dataset.countryCode;if(state.selected.has(code))state.selected.delete(code);else state.selected.add(code);render();return true}
  if(button.id==='countryNext'){if(state.selected.size)window.CountryV2.go('activities');return true}
  return false;
 }
 window.CountryV2Countries=Object.freeze({render,handle,get selected(){return [...state.selected]}});
})();
