/* Run: node games/country-capital-flag-v2/design-smoke-test.cjs
   Static regression checks only; browser/iPad testing is still required. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const html=read('index.html'),css=read('design-refresh.css'),learning=read('learning.js'),quiz=read('quiz.js'),app=read('app.js');
const checks=[
 ['design stylesheet linked',()=>assert.match(html,/design-refresh\.css/)],
 ['screen IDs present',()=>['home','continents','topics','countries','activities','learning','quiz','result','flags','treasures','progress'].forEach(id=>assert.match(html,new RegExp('id="'+id+'"')))],
 ['learning UI elements present',()=>['learningFlag','learningCountry','learningCapital','learningNext'].forEach(id=>assert.match(html,new RegExp('id="'+id+'"')))],
 ['quiz OX and metronome controls present',()=>['quizYes','quizNo','quizBpm','quizMetroToggle','quizLeftFlag','quizRightText'].forEach(id=>assert.match(html,new RegExp('id="'+id+'"')))],
 ['quiz flag goes left',()=>assert.match(quiz,/\$\('quizLeftFlag'\)\.src=/)],
 ['quiz flag-country text goes right',()=>assert.match(quiz,/\$\('quizRightText'\)\.textContent=q\.partner\.country/)],
 ['quiz OX answer handlers preserved',()=>{assert.match(quiz,/answer\(true\)/);assert.match(quiz,/answer\(false\)/)}],
 ['metronome tempo retained',()=>assert.match(quiz,/60000\/Number\(\$\('quizBpm'\)/)],
 ['capital learning mode retained',()=>assert.match(learning,/capital-mode/)],
 ['capital left-right split styled',()=>assert.match(css,/learning-card:has\(\.capital-mode\)/)],
 ['OX buttons styled',()=>{assert.match(css,/#quiz #quizYes::after/);assert.match(css,/#quiz #quizNo::after/)}],
 ['navigation and reward route retained',()=>{assert.match(app,/country-v2:navigate/);assert.match(app,/quizReward/)}],
];
let failed=0;
for(const [name,fn] of checks){try{fn();console.log('PASS',name)}catch(err){failed++;console.error('FAIL',name,err.message)}}
console.log(`${checks.length-failed}/${checks.length} static checks passed`);
if(failed)process.exitCode=1;
