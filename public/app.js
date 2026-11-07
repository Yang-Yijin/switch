/* Pure rotation rules are also exported for Node tests. */
const PEOPLE = [
  {id:'steve',name:'Steve',gender:'M',partner:'Kathay'},
  {id:'kathay',name:'Kathay',gender:'F',partner:'Steve'},
  {id:'stella',name:'Stella',gender:'F',partner:'Alyx'},
  {id:'alyx',name:'Alyx',gender:'M',partner:'Stella'},
  {id:'frances',name:'Frances',gender:'F',partner:'Ray'},
  {id:'ray',name:'Ray',gender:'M',partner:'Frances'}
];
function fresh(){return {people:structuredClone(PEOPLE),slots:[null,null,null,null],bench:PEOPLE.map(p=>p.id),entered:{},tick:0,round:0,scores:[0,0]};}
function person(s,id){return s.people.find(p=>p.id===id);}
function validTeams(s){return [0,2].every(i=>!s.slots[i]||!s.slots[i+1]||person(s,s.slots[i]).gender!==person(s,s.slots[i+1]).gender);}
function validState(s){
  if(!s||!Array.isArray(s.people)||s.people.length!==6||!Array.isArray(s.slots)||s.slots.length!==4||!Array.isArray(s.bench))return false;
  if(!PEOPLE.every(p=>s.people.some(q=>q.id===p.id&&q.name===p.name&&['M','F'].includes(q.gender))))return false;
  const ids=[...s.slots.filter(Boolean),...s.bench];
  if(ids.length!==6||new Set(ids).size!==6||ids.some(id=>!person(s,id)))return false;
  if(!s.entered||!Number.isSafeInteger(s.tick)||s.tick<0||!Number.isSafeInteger(s.round)||s.round<0)return false;
  if(s.scores!==undefined&&(!Array.isArray(s.scores)||s.scores.length!==2||!s.scores.every(n=>Number.isSafeInteger(n)&&n>=0)))return false;
  const timestamps=s.slots.filter(Boolean).map(id=>s.entered[id]);
  return validTeams(s)&&timestamps.every(n=>Number.isSafeInteger(n)&&n>0&&n<=s.tick)&&new Set(timestamps).size===timestamps.length;
}
function move(s,id,target){
  const n=structuredClone(s),from=n.slots.indexOf(id);
  if(!person(n,id))throw Error('Player not found.');
  if(target==='bench'){
    if(from<0)return n;
    n.slots[from]=null;n.bench.push(id);delete n.entered[id];return n;
  }
  if(!Number.isInteger(target)||target<0||target>3)throw Error('Select a court position.');
  if(from===target)return n;
  const displaced=n.slots[target];
  if(from>=0){n.slots[from]=displaced;}else{
    const index=n.bench.indexOf(id);n.bench.splice(index,1);
    if(displaced){n.bench.push(displaced);delete n.entered[displaced];}
    n.entered[id]=++n.tick;
  }
  n.slots[target]=id;
  if(!validTeams(n))throw Error('Each team needs one man and one woman. Choose another position or replace a player of the same gender.');
  if(n.slots.every(Boolean)&&n.round===0)n.round=1;
  return n;
}
function fill(s){
  let n=structuredClone(s);
  for(let i=0;i<4;i++){
    if(n.slots[i])continue;
    const teammate=n.slots[i^1];
    const id=n.bench.find(id=>!teammate||person(n,id).gender!==person(n,teammate).gender);
    if(!id)throw Error('A player of the opposite gender is needed to complete this team.');
    n=move(n,id,i);
  }
  return n;
}
function rotation(s){
  if(s.slots.some(id=>!id))return [];
  const available=s.slots.map((id,index)=>({id,index,gender:person(s,id).gender,entered:s.entered[id]})).sort((a,b)=>a.entered-b.entered);
  return s.bench.map(id=>{
    const i=available.findIndex(p=>p.gender===person(s,id).gender);
    if(i<0)throw Error('These gender settings cannot maintain mixed doubles.');
    const out=available.splice(i,1)[0];return {incoming:id,outgoing:out.id,index:out.index};
  });
}
function advance(s){
  if(s.slots.some(id=>!id))return fill(s);
  const n=structuredClone(s),plan=rotation(s);
  for(const r of plan){n.slots[r.index]=r.incoming;delete n.entered[r.outgoing];n.entered[r.incoming]=++n.tick;}
  n.bench=plan.map(r=>r.outgoing);n.round++;n.scores=[0,0];return n;
}
function changeScore(s,team,delta){
  if(![0,1].includes(team)||![1,-1].includes(delta))throw Error('Invalid score change.');
  const n=structuredClone(s);n.scores=n.scores||[0,0];
  const score=n.scores[team]+delta;
  if(Number.isSafeInteger(score)&&score>=0)n.scores[team]=score;
  return n;
}
function resetScores(s){const n=structuredClone(s);n.scores=[0,0];return n;}
function swapTeam(s,team){
  if(![0,1].includes(team))throw Error('Invalid team.');
  const n=structuredClone(s),i=team*2;
  [n.slots[i],n.slots[i+1]]=[n.slots[i+1],n.slots[i]];return n;
}
function switchEnds(s){
  const n=structuredClone(s);n.slots=[...s.slots.slice(2),...s.slots.slice(0,2)];
  n.scores=[...(s.scores||[0,0])].reverse();return n;
}
if(typeof module!=='undefined')module.exports={fresh,move,fill,rotation,advance,validState,validTeams,changeScore,resetScores,swapTeam,switchEnds};
if(typeof document!=='undefined'){
const KEY='six-on-court-v1';let state=fresh(),history=[],selected=null;
let storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(validState(saved))state={...saved,scores:saved.scores||[0,0]};}catch{storageAvailable=false;}
const $=id=>document.getElementById(id);
function notify(message){$('status').textContent=message;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageAvailable=false;}if(!storageAvailable)notify('Saving is unavailable. Keep this page open to retain this session.');}
function commit(next,message){history.push(structuredClone(state));if(history.length>50)history.shift();state=next;selected=null;render();persist();if(storageAvailable)notify(message);}
function attempt(id,target){try{commit(move(state,id,target),'Position updated. Moving within the court keeps the entry order.');}catch(e){notify(e.message);}}
function card(id,onCourt){
 const p=person(state,id),el=document.createElement('button');el.type='button';el.draggable=true;el.className='player '+(p.gender==='F'?'female ':'')+(selected===id?'selected':'');el.dataset.player=id;el.setAttribute('aria-pressed',String(selected===id));
 const order=state.slots.filter(Boolean).sort((a,b)=>state.entered[a]-state.entered[b]).indexOf(id)+1;
 el.innerHTML='<span class="avatar">'+p.name.slice(0,2).toUpperCase()+'</span><span><span class="player-name">'+p.name+'</span><span class="player-sub">'+(onCourt?'Entry #'+order:'Waiting')+'</span></span><span class="gender">'+(p.gender==='M'?'♂':'♀')+'</span>';
 el.setAttribute('aria-label',p.name+', '+(p.gender==='M'?'Man':'Woman')+', '+(onCourt?'Entry order '+order:'Resting')+', select to move');
 el.addEventListener('click',e=>{e.stopPropagation();const target=el.closest('[data-slot]');if(selected&&selected!==id&&target){attempt(selected,Number(target.dataset.slot));return;}selected=selected===id?null:id;render();notify(selected?'Selected '+p.name+', choose a court position or move to rest.':'Selection cleared.');});
 el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='move';});return el;
}
function render(){
 $('round').textContent=String(state.round).padStart(2,'0');$('court-count').textContent=state.slots.filter(Boolean).length+' / 4';$('bench-count').textContent=state.bench.length+' players';
 document.querySelectorAll('[data-slot]').forEach((el,i)=>{el.replaceChildren();if(state.slots[i])el.append(card(state.slots[i],true));else{const b=document.createElement('button');b.className='empty-slot';b.innerHTML='<b>＋</b><span>Add player</span>';b.setAttribute('aria-label',(i<2?'A':'B')+' position '+(i%2+1)+', Add player');el.append(b);}});
 $('bench').replaceChildren(...state.bench.map(id=>card(id,false)));
 for(let team=0;team<2;team++){
   $('score-'+team).textContent=state.scores[team];
   $('minus-'+team).disabled=state.scores[team]===0;
   $('swap-'+team).disabled=!state.slots.slice(team*2,team*2+2).some(Boolean);
 }
 $('reset-scores').disabled=state.scores.every(n=>n===0);
 $('switch-ends').disabled=!state.slots.some(Boolean);
 const full=state.slots.every(Boolean);$('rotate').innerHTML=(full?'Next round':state.slots.some(Boolean)?'Fill empty positions':'Auto-fill court')+' <span>↗</span>';
 $('next-title').textContent=full?'Next rotation':'Starting lineup';
 $('preview').replaceChildren();
 if(full){for(const r of rotation(state)){const el=document.createElement('div');el.className='swap-row';el.innerHTML='<span>'+person(state,r.outgoing).name+' <small>out</small></span><span>→</span><b>'+person(state,r.incoming).name+' <small>in</small></b>';$('preview').append(el);}}
 else $('preview').textContent='Add four players manually or auto-fill the court.';
 $('rotation-note').textContent=full?'The earliest-entered player of the same gender rotates out. Scores reset each round.':'Each team needs one man and one woman.';$('undo').disabled=!history.length;
}
for(const el of document.querySelectorAll('[data-slot]')){
 el.addEventListener('click',()=>{if(selected)attempt(selected,Number(el.dataset.slot));else notify('Select a player first.');});
 el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over');});
 el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
 el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag-over');attempt(e.dataTransfer.getData('text/plain'),Number(el.dataset.slot));});
}
$('bench-target').addEventListener('click',()=>{if(selected)attempt(selected,'bench');else notify('Select a player on court first.');});
$('bench-zone').addEventListener('dragover',e=>{e.preventDefault();$('bench-zone').classList.add('drag-over');});
$('bench-zone').addEventListener('dragleave',()=>$('bench-zone').classList.remove('drag-over'));
$('bench-zone').addEventListener('drop',e=>{e.preventDefault();$('bench-zone').classList.remove('drag-over');attempt(e.dataTransfer.getData('text/plain'),'bench');});
for(let team=0;team<2;team++){
 $('plus-'+team).addEventListener('click',()=>commit(changeScore(state,team,1),'Team '+(team===0?'A':'B')+' +1.'));
 $('minus-'+team).addEventListener('click',()=>commit(changeScore(state,team,-1),'Team '+(team===0?'A':'B')+' −1.'));
 $('swap-'+team).addEventListener('click',()=>commit(swapTeam(state,team),'Team '+(team===0?'A':'B')+' positions swapped. Entry order kept.'));
}
$('reset-scores').addEventListener('click',()=>commit(resetScores(state),'Scores reset.'));
$('switch-ends').addEventListener('click',()=>commit(switchEnds(state),'Teams switched ends. Scores follow the players; entry order kept.'));
$('rotate').addEventListener('click' ,()=>{try{const full=state.slots.every(Boolean);commit(advance(state),full?'Rotation complete. Scores reset for the new round.':'Starting lineup ready.');}catch(e){notify(e.message);}});
$('undo').addEventListener('click',()=>{if(!history.length)return;state=history.pop();selected=null;render();persist();if(storageAvailable)notify('Last action undone.');});
$('reset').addEventListener('click',()=>{$('reset-dialog').returnValue='';$('reset-dialog').showModal();});
$('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='reset'){const n=fresh();n.people=structuredClone(state.people);commit(n,'Session reset.');}});
$('settings-button').addEventListener('click',()=>{
 $('player-settings').replaceChildren(...state.people.map(p=>{const row=document.createElement('label');row.className='setting-row';row.innerHTML='<span>'+p.name+' <small>Partner: '+p.partner+'</small></span><select data-gender="'+p.id+'" aria-label="'+p.name+' gender"><option value="M">Man</option><option value="F">Woman</option></select>';row.querySelector('select').value=p.gender;return row;}));$('settings').showModal();
});
$('save-settings').addEventListener('click',()=>{
 const people=structuredClone(state.people);for(const select of document.querySelectorAll('[data-gender]'))people.find(p=>p.id===select.dataset.gender).gender=select.value;
 const men=people.filter(p=>p.gender==='M').length;if(men<2||men>4){notify('Mixed doubles needs at least two men and two women.');$('settings').close();return;}
 const changed=people.some((p,i)=>p.gender!==state.people[i].gender);$('settings').close();if(changed){const n=fresh();n.people=people;commit(n,'Gender settings saved. Arrange a new starting lineup.');}else notify('Settings saved.');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=null;render();}});render();
}
