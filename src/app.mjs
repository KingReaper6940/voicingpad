import {History} from './edit.mjs';import {example} from './example.mjs';import {clone,parseFrets,parseFingers,fretText,fingerText} from './model.mjs';import {noteName,parseTuning,sounding,receipt} from './pitch.mjs';import {cardSvg,boardSvg} from './diagram.mjs';
export function mount(doc,env={}){
 const $=id=>doc.getElementById(id),history=new History(example),urlApi=env.URL??globalThis.URL,urls=new Map();
 let selected=history.current.cards[0].id,cardDraft=false,settingsDraft=false,revision=0;
 const card=()=>history.current.cards.find(c=>c.id===selected)??history.current.cards[0];
 const say=(s,error=false)=>{$('status').textContent=s;$('status').classList.toggle('error',error);};
 const dirty=()=>{const yes=cardDraft||settingsDraft;$('draft-status').textContent=yes?'Unapplied draft · downloads use applied edits':'All edits applied';$('draft-status').classList.toggle('dirty',yes);return yes;};
 const blob=(key,text,type)=>{const u=urlApi.createObjectURL(new Blob([text],{type}));urls.set(key,u);return u;};
 function forms(){
 const b=history.current,c=card();
 if(!settingsDraft){$('title').value=b.title;$('tuning').value=b.tuning.map(m=>noteName(m,b.spelling)).join(' ');$('spelling').value=b.spelling;$('handed').value=b.handed;}
 if(!cardDraft){$('name').value=c.name;$('note').value=c.note;$('frets').value=fretText(c);$('fingers').value=fingerText(c);}
 $('editor-title').textContent='Edit '+(c.name||c.id);
 $('pitches').replaceChildren();for(const row of sounding(b,c)){const tr=doc.createElement('tr');for(const value of [row.string,row.fret===null?'x':row.fret,row.note,row.midi===null?'—':row.midi]){const td=doc.createElement('td');td.textContent=String(value);tr.append(td);}$('pitches').append(tr);}
 }
 function render(){
 const b=history.current;if(!b.cards.some(c=>c.id===selected))selected=b.cards[0].id;
 for(const url of urls.values())urlApi.revokeObjectURL(url);urls.clear();
 $('cards').replaceChildren();
 b.cards.forEach((c,i)=>{
 const article=doc.createElement('article');article.className='card'+(c.id===selected?' selected':'');
 const choose=doc.createElement('button');choose.type='button';choose.className='card-select';choose.dataset.action='select';choose.dataset.id=c.id;choose.setAttribute('aria-label','Edit '+c.id+' '+(c.name||'untitled voicing'));choose.setAttribute('aria-pressed',String(c.id===selected));
 const img=doc.createElement('img');img.width=300;img.height=460;img.alt=(c.name||'Untitled voicing')+', frets '+fretText(c)+', strings 6 to 1';img.src=blob(c.id,cardSvg(b,c),'image/svg+xml');choose.append(img);
 const caption=doc.createElement('div');caption.className='card-caption';const title=doc.createElement('strong'),shape=doc.createElement('span');title.textContent=(i+1)+'. '+(c.name||'Untitled voicing');shape.textContent=fretText(c);caption.append(title,shape);
 const actions=doc.createElement('div');actions.className='card-actions';
 for(const [action,label] of [['earlier','←'],['later','→'],['duplicate','Clone'],['delete','Delete']]){const button=doc.createElement('button');button.type='button';button.textContent=label;button.dataset.id=c.id;button.dataset.action=action;button.setAttribute('aria-label',action+' '+c.id);button.disabled=action==='earlier'&&i===0||action==='later'&&i===b.cards.length-1||action==='delete'&&b.cards.length===1||action==='duplicate'&&b.cards.length===24;actions.append(button);}
 article.append(choose,caption,actions);$('cards').append(article);
 });
 $('board-heading').textContent=b.title||'Untitled board';$('board-meta').textContent=b.cards.length+' / 24 cards · '+b.handed+' view · strings 6 → 1';
 $('save-board').href=blob('board',boardSvg(b),'image/svg+xml');$('save-card').href=urls.get(card().id);
 $('save-project').href=blob('project',JSON.stringify(b,null,2)+'\n','application/json');$('save-receipt').href=blob('receipt',JSON.stringify(receipt(b),null,2)+'\n','application/json');
 $('undo').disabled=!history.past.length;$('redo').disabled=!history.future.length;$('add').disabled=b.cards.length===24;forms();dirty();
 }
 function clean(){if(!dirty())return true;say('Apply or discard your drafts before changing cards, order or history.',true);return false;}
 function apply(action,message){
 try{if(history.apply(action))revision++;render();say(message);return true;}catch(e){say(e.message,true);return false;}
 }
 for(const id of ['name','note','frets','fingers'])$(id).addEventListener('input',()=>{cardDraft=true;revision++;dirty();});
 for(const id of ['title','tuning','spelling','handed'])$(id).addEventListener(id==='spelling'||id==='handed'?'change':'input',()=>{settingsDraft=true;revision++;dirty();});
 $('card-form').addEventListener('submit',e=>{
 e.preventDefault();try{
 const action={type:'update',id:selected,name:$('name').value,note:$('note').value,frets:parseFrets($('frets').value),fingers:parseFingers($('fingers').value)};
 const was=cardDraft;cardDraft=false;if(!apply(action,'Shape applied. Save a project to keep this exact voicing.'))cardDraft=was;dirty();
 }catch(error){say(error.message,true);}
 });
 $('settings-form').addEventListener('submit',e=>{
 e.preventDefault();try{const action={type:'settings',title:$('title').value,tuning:parseTuning($('tuning').value),spelling:$('spelling').value,handed:$('handed').value};
 const was=settingsDraft;settingsDraft=false;if(!apply(action,'Board settings applied. Frets stay fixed; sounding pitches follow the tuning.'))settingsDraft=was;dirty();
 }catch(error){say(error.message,true);}
 });
 $('discard-card').addEventListener('click',()=>{cardDraft=false;forms();dirty();say('Card draft discarded.');});
 $('discard-settings').addEventListener('click',()=>{settingsDraft=false;forms();dirty();say('Settings draft discarded.');});
 $('cards').addEventListener('click',e=>{
 const button=e.target.closest('button[data-action]');if(!button||!clean())return;const {action,id}=button.dataset,index=history.current.cards.findIndex(c=>c.id===id);
 if(action==='select'){selected=id;render();say('Selected '+(card().name||id)+'.');}
 else{selected=id;const type=['earlier','later'].includes(action)?'move':action;
 if(apply({type,id,to:index+(action==='earlier'?-1:1)},'Board updated. Undo is available.')&&action==='duplicate'){selected=history.current.cards[index+1].id;render();}}
 doc.querySelector('button[data-action="select"][data-id="'+selected+'"]')?.focus();
 });
 $('add').addEventListener('click',()=>{if(clean()&&apply({type:'add'},'Blank voicing added. Enter the shape in the editor.')){selected=history.current.cards.at(-1).id;render();}});
 for(const id of ['undo','redo'])$(id).addEventListener('click',()=>{if(!clean())return;if(history[id]()){revision++;render();say(id==='undo'?'Previous board restored.':'Board edit restored.');}});
 function load(board){const next=clone(board);history.replace(next);selected=history.current.cards[0].id;cardDraft=false;settingsDraft=false;revision++;render();say('Project loaded. Previous applied board is available with Undo.');}
 $('example').addEventListener('click',()=>load(example));
 $('copy-shape').addEventListener('click',async()=>{try{await (env.clipboard??globalThis.navigator.clipboard).writeText(fretText(card()));say('Applied fret entry copied.');}catch{say('Clipboard unavailable. Copy the fret entry from the editor after discarding any draft.',true);}});
 render();
 return {history,load,say,get revision(){return revision;},get selected(){return selected;},dispose(){for(const url of urls.values())urlApi.revokeObjectURL(url);urls.clear();}};
}
if(typeof document!=='undefined')mount(document);
