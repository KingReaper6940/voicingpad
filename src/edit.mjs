import {clone,validate} from './model.mjs';
export function edit(board,action){
 const next=clone(board),index=next.cards.findIndex(c=>c.id===action.id);
 const selected=()=>{if(index<0)throw Error('Select a voicing card.');return next.cards[index];};
 const newId=()=>{const n=Math.max(0,...next.cards.map(c=>Number(c.id.slice(1))))+1;return 'v'+n;};
 switch(action.type){
 case 'settings':next.title=action.title;next.tuning=[...action.tuning];next.handed=action.handed;next.spelling=action.spelling;break;
 case 'update':{const card=selected();card.name=action.name;card.note=action.note;card.frets=[...action.frets];card.fingers=[...action.fingers];break;}
 case 'add':next.cards.push({id:newId(),name:'New voicing',note:'',frets:Array(6).fill(null),fingers:Array(6).fill(null)});break;
 case 'duplicate':{const card=structuredClone(selected());card.id=newId();next.cards.splice(index+1,0,card);break;}
 case 'delete':selected();if(next.cards.length===1)throw Error('Keep at least one card.');next.cards.splice(index,1);break;
 case 'move':{selected();if(!Number.isInteger(action.to)||action.to<0||action.to>=next.cards.length)throw Error('The card is already at that edge.');const [card]=next.cards.splice(index,1);next.cards.splice(action.to,0,card);break;}
 default:throw Error('Unknown edit.');
 }return validate(next);
}
export class History{
 constructor(board){this.current=clone(board);this.past=[];this.future=[];}
 replace(board){const next=clone(board);if(JSON.stringify(next)===JSON.stringify(this.current))return false;this.past.push(this.current);if(this.past.length>25)this.past.shift();this.current=next;this.future=[];return true;}
 apply(action){return this.replace(edit(this.current,action));}
 undo(){if(!this.past.length)return false;this.future.push(this.current);this.current=this.past.pop();return true;}
 redo(){if(!this.future.length)return false;this.past.push(this.current);this.current=this.future.pop();return true;}
}
