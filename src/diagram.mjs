import {validate,validateCard,windowFor} from './model.mjs';import {sounding,noteName} from './pitch.mjs';
export const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wrap(s,count){const chars=[...s],out=[];for(let i=0;i<chars.length;i+=count)out.push(chars.slice(i,i+count).join(''));return out.length?out:[''];}
export function geometry(card,handed='right'){
 validateCard(card);if(!['right','left'].includes(handed))throw Error('Invalid orientation.');
 const {start}=windowFor(card.frets);
 return {start,strings:card.frets.map((fret,i)=>({string:6-i,x:62+(handed==='left'?5-i:i)*35,kind:fret===null?'muted':fret===0?'open':'fretted',y:fret===null||fret===0?91:110+(fret-start+.5)*30,fret,finger:card.fingers[i]}))};
}
function content(board,card,index=0){
 const g=geometry(card,board.handed),notes=sounding(board,card),parts=[];
 parts.push('<rect x="8" y="8" width="284" height="444" rx="12" fill="#fffdf7" stroke="#d6d2c8"/>');
 parts.push('<title>'+escape(card.name||'Untitled voicing')+'; '+escape(card.note)+'</title>');
 parts.push('<text x="277" y="26" text-anchor="end" fill="#787d77" font-size="9">'+String(index+1).padStart(2,'0')+'</text>');
 wrap(card.name||'Untitled voicing',16).forEach((line,i)=>parts.push('<text x="150" y="'+(30+i*20)+'" text-anchor="middle" fill="#203b38" font-size="16" font-family="sans-serif">'+escape(line)+'</text>'));
 for(let row=0;row<=5;row++)parts.push('<line x1="62" x2="237" y1="'+(110+row*30)+'" y2="'+(110+row*30)+'" stroke="#8d9b92" stroke-width="'+(row===0&&g.start===1?4:1)+'"/>');
 for(let row=0;row<5;row++)parts.push('<text x="41" y="'+(130+row*30)+'" text-anchor="middle" fill="#596c61" font-size="10">'+(g.start+row)+'</text>');
 for(const s of g.strings){
 parts.push('<line x1="'+s.x+'" x2="'+s.x+'" y1="110" y2="260" stroke="#536d62" stroke-width="1"/>');
 if(s.kind==='muted')parts.push('<text x="'+s.x+'" y="97" text-anchor="middle" fill="#697b72" font-size="18">×</text>');
 else if(s.kind==='open')parts.push('<circle cx="'+s.x+'" cy="91" r="5" stroke="#386d5c" stroke-width="1.5" fill="none"/>');
 else{parts.push('<circle cx="'+s.x+'" cy="'+s.y+'" r="10" fill="#28644f"/>');if(s.finger!==null)parts.push('<text x="'+s.x+'" y="'+(s.y+3.5)+'" text-anchor="middle" fill="#ffffff" font-size="10">'+s.finger+'</text>');}
 const n=notes[6-s.string];parts.push('<text x="'+s.x+'" y="284" text-anchor="middle" fill="#536d62" font-size="10">'+s.string+'</text><text x="'+s.x+'" y="304" text-anchor="middle" fill="#203b38" font-size="10" font-family="monospace">'+escape(n.midi===null?'—':n.note)+'</text>');
 }
 parts.push('<text x="150" y="324" text-anchor="middle" fill="#788579" font-size="9">STRING NUMBER / SOUNDING NOTE</text>');
 wrap(card.note,24).forEach((line,i)=>parts.push('<text x="25" y="'+(350+i*17)+'" fill="#536d62" font-size="11" font-family="sans-serif">'+escape(line)+'</text>'));
 return parts.join('');
}
export function cardSvg(board,card){
 validate(board);validateCard(card);return '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="460" viewBox="0 0 300 460" role="img" aria-labelledby="title desc"><title id="title">'+escape(card.name||'Untitled voicing')+'</title><desc id="desc">Custom six-string voicing. '+escape(board.handed)+' orientation. String numbers and sounding pitches are shown below the diagram.</desc>'+content(board,card,board.cards.findIndex(c=>c.id===card.id))+'</svg>';
}
export function boardSvg(board){
 validate(board);const columns=Math.min(3,board.cards.length),width=columns*300+32,title=wrap(board.title||'Voicing board',Math.max(1,Math.floor((width-48)/24))),header=title.length*28+95,height=header+Math.ceil(board.cards.length/columns)*460+24;
 const parts=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="title desc"><title id="title">'+escape(board.title||'Voicing board')+'</title><desc id="desc">'+board.cards.length+' custom voicing cards in order. '+board.handed+' orientation.</desc><rect width="'+width+'" height="'+height+'" fill="#f1f0e8"/>'];
 title.forEach((line,i)=>parts.push('<text x="24" y="'+(38+i*28)+'" fill="#203b38" font-family="sans-serif" font-size="24">'+escape(line)+'</text>'));
 const tuning=board.tuning.map(m=>noteName(m,board.spelling)).join(' ');
 parts.push('<text x="24" y="'+(header-35)+'" fill="#536d62" font-family="monospace" font-size="11">Strings 6 to 1: '+escape(tuning)+'</text>');
 board.cards.forEach((c,i)=>parts.push('<g transform="translate('+(16+i%columns*300)+','+(header+Math.floor(i/columns)*460)+')">'+content(board,c,i)+'</g>'));
 parts.push('</svg>');return parts.join('');
}
