import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {validate,validateCard,windowFor,parseFrets,parseFingers,clone} from '../src/model.mjs';import {parseNote,parseTuning,noteName,sounding,receipt} from '../src/pitch.mjs';import {History,edit} from '../src/edit.mjs';import {geometry,cardSvg,boardSvg} from '../src/diagram.mjs';import {readProject,readFile} from '../src/handoff.mjs';import {example} from '../src/example.mjs';
test('scientific pitch mapping handles octave boundaries and enharmonic names',()=>{
 for(const [name,midi] of [['C4',60],['A4',69],['E2',40],['Cb4',59],['B#3',60],['F♯3',54],['Bb3',58]])assert.equal(parseNote(name),midi);
 assert.equal(noteName(61,'flats'),'Db4');assert.equal(noteName(61),'C#4');
 assert.deepEqual(parseTuning('E2 A2 D3 G3 B3 E4'),[40,45,50,55,59,64]);
 for(const value of ['H2','C##4','C0','C7','C','E2x'])assert.throws(()=>parseNote(value));
});
test('all allowed open-string MIDI pitches roundtrip both spellings',()=>{
 for(let n=24;n<=84;n++)for(const spelling of ['sharps','flats'])assert.equal(parseNote(noteName(n,spelling)),n);
});
test('six-string entry is explicit, preserves mute/open distinction and rejects accidental compact strings',()=>{
 assert.deepEqual(parseFrets('x 3 2 0 1 0'),[null,3,2,0,1,0]);assert.deepEqual(parseFrets('X 10 12 12 11 10'),[null,10,12,12,11,10]);
 assert.deepEqual(parseFingers('- 3 2 - 1 -'),[null,3,2,null,1,null]);
 for(const s of ['x32010','x 3 2 0 1','x 3 2 0 1 25','x 3 2 0 1 -1','x 3 2 0 1 1.5','x 03 2 0 1 0'])assert.throws(()=>parseFrets(s));
 assert.throws(()=>parseFingers('- 5 2 - 1 -'));
});
test('known standard-tuning C voicing and alternate tuning produce exact string pitches',()=>{
 const b=clone(example),c=b.cards[0];assert.deepEqual(sounding(b,c).map(x=>x.midi),[null,48,52,55,60,64]);assert.deepEqual(sounding(b,c).map(x=>x.note),['muted','C3','E3','G3','C4','E4']);
 b.tuning[5]=62;assert.equal(sounding(b,c)[5].note,'D4');assert.equal(sounding(b,c)[1].midi,48);
 assert.deepEqual(c.frets,[null,3,2,0,1,0]);
});
test('finger labels require fretted strings and wide shapes fail rather than clip',()=>{
 const c=structuredClone(example.cards[0]);c.fingers[0]=1;assert.throws(()=>validateCard(c),/Fingers/);
 c.fingers[0]=null;c.fingers[3]=1;assert.throws(()=>validateCard(c),/Fingers/);
 c.fingers[3]=null;c.frets=[1,6,null,0,0,null];c.fingers=Array(6).fill(null);assert.throws(()=>validateCard(c),/five consecutive/);
});
test('position windows include all high frets and do not extend beyond fret 24',()=>{
 for(let min=1;min<=24;min++)for(let width=0;width<=Math.min(4,24-min);width++){
 const c={...structuredClone(example.cards[0]),frets:[min,min+width,0,null,0,null],fingers:Array(6).fill(null)},g=geometry(c);
 assert.ok(g.start>=1&&g.start+4<=24);for(const s of g.strings.filter(x=>x.kind==='fretted'))assert.ok(s.y>110&&s.y<260);
 }
 assert.equal(windowFor([null,24,24,0,null,0]).start,20);
 assert.equal(windowFor([null,0,0,0,0,0]).start,1);
});
test('left orientation mirrors every physical string but leaves musical order and pitch intact',()=>{
 const c=example.cards[0],r=geometry(c),l=geometry(c,'left');for(let i=0;i<6;i++){assert.equal(r.strings[i].x+l.strings[i].x,299);assert.equal(r.strings[i].string,l.strings[i].string);assert.equal(r.strings[i].y,l.strings[i].y);}
 const b=clone(example),before=sounding(b,b.cards[0]);b.handed='left';assert.deepEqual(sounding(b,b.cards[0]),before);
});
test('SVG places expected dots and finger text, escapes labels and has no active content',()=>{
 const b=clone(example);b.cards[0].name='<script>&"';b.cards[0].note='Use <img src=x> & keep it.';
 const svg=cardSvg(b,b.cards[0]),dom=new JSDOM(svg,{contentType:'image/svg+xml'}),d=dom.window.document;
 try{assert.equal(d.querySelectorAll('script,image,foreignObject,a').length,0);assert.equal(d.querySelectorAll('circle[fill="#28644f"]').length,3);
 const dots=[...d.querySelectorAll('circle[fill="#28644f"]')].map(x=>[Number(x.getAttribute('cx')),Number(x.getAttribute('cy'))]);assert.deepEqual(dots,[[97,185],[132,155],[202,125]]);
 assert.ok(d.documentElement.textContent.includes('<script>&"'));assert.ok(d.documentElement.textContent.includes('Use <img src=x>'));}finally{dom.window.close();}
});
test('board exports contain every card in order and complete receipt string data',()=>{
 const b=clone(example),svg=boardSvg(b),dom=new JSDOM(svg,{contentType:'image/svg+xml'});
 try{const groups=[...dom.window.document.querySelectorAll('svg>g')];assert.equal(groups.length,4);assert.deepEqual(groups.map(g=>g.querySelector('title').textContent.split(';')[0]),['C','Am','Fmaj7','G6']);assert.ok(Number(dom.window.document.documentElement.getAttribute('height'))>900);}finally{dom.window.close();}
 const r=receipt(b);assert.equal(r.cards.length,4);assert.equal(r.cards.flatMap(c=>c.strings).length,24);assert.equal(r.cards[0].strings[0].midi,null);
});
test('board edits preserve input and clone identities without sharing nested arrays',()=>{
 const b=clone(example),before=JSON.stringify(b),next=edit(b,{type:'duplicate',id:'v1'});
 assert.equal(JSON.stringify(b),before);assert.equal(next.cards[1].id,'v5');next.cards[1].frets[1]=4;assert.equal(next.cards[0].frets[1],3);
 const moved=edit(b,{type:'move',id:'v1',to:3});assert.deepEqual(moved.cards.map(c=>c.id),['v2','v3','v4','v1']);
 const one=clone(example);one.cards=[one.cards[0]];assert.throws(()=>edit(one,{type:'delete',id:'v1'}));assert.throws(()=>edit(b,{type:'move',id:'v1',to:-1}));
});
test('history restores exact boards and invalid edits cannot consume history',()=>{
 const h=new History(example);for(let i=0;i<35;i++)h.apply({type:'settings',title:String(i),tuning:[40,45,50,55,59,64],spelling:'sharps',handed:'right'});
 assert.equal(h.past.length,25);h.undo();assert.equal(h.current.title,'33');h.redo();assert.equal(h.current.title,'34');
 h.undo();const before=JSON.stringify(h);assert.throws(()=>h.apply({type:'move',id:'missing',to:0}));assert.equal(JSON.stringify(h),before);
 h.apply({type:'settings',title:'New',tuning:[38,45,50,55,59,64],spelling:'flats',handed:'left'});assert.equal(h.future.length,0);
});
test('malformed shape and project fields fail strictly',()=>{
 const bad=clone(example);bad.extra=true;assert.throws(()=>validate(bad));const ids=clone(example);ids.cards[1].id='v1';assert.throws(()=>validate(ids),/unique/);
 for(const patch of [{schema:'v2'},{tuning:[40,45,50,55,59,128]},{handed:'sideways'},{title:'\u0000'},{title:'\uD800'}])assert.throws(()=>validate({...clone(example),...patch}));
 const c=clone(example).cards[0];assert.throws(()=>validateCard({...c,frets:[null,3,2,0,1]}));
});
test('maximum 24-card project roundtrips and exports all cards without truncation',()=>{
 const b=clone(example);b.title='"\\'.repeat(40);b.cards=Array.from({length:24},(_,i)=>({id:'v'+(i+1),name:'"\\'.repeat(20),note:'"\\'.repeat(60),frets:[null,20,21,22,23,24],fingers:[null,1,2,3,4,4]}));
 const text=JSON.stringify(b,null,2);assert.ok(text.length<=30000);assert.deepEqual(readProject(text),b);
 const dom=new JSDOM(boardSvg(b),{contentType:'image/svg+xml'});try{assert.equal(dom.window.document.querySelectorAll('svg>g').length,24);}finally{dom.window.close();}
 assert.throws(()=>edit(b,{type:'add'}),/1–24/);
});
test('file imports require fatal bounded UTF-8 and validate decoded project',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify(example));assert.deepEqual(await readFile({size:bytes.length,arrayBuffer:async()=>bytes.buffer}),example);
 await assert.rejects(()=>readFile({size:120001}),/120,000/);await assert.rejects(()=>readFile({size:1,arrayBuffer:async()=>Uint8Array.of(0xff).buffer}));
 assert.throws(()=>readProject('x'.repeat(30001)),/30,000/);
});
