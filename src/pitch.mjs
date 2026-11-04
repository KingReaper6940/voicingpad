import {validate,validateCard,label} from './model.mjs';
const SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export function noteName(midi,spelling='sharps'){
 if(!Number.isInteger(midi)||midi<0||midi>127||!['sharps','flats'].includes(spelling))throw Error('Invalid MIDI pitch or spelling.');
 return (spelling==='sharps'?SHARP:FLAT)[midi%12]+(Math.floor(midi/12)-1);
}
export function parseNote(s){
 label(s,8,'Tuning note');const match=/^([A-Ga-g])([#b♯♭]?)([0-8])$/.exec(s);
 if(!match)throw Error('Use scientific pitch names such as E2, F#3 or Bb3.');
 const base={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1].toUpperCase()],acc=['#','♯'].includes(match[2])?1:['b','♭'].includes(match[2])?-1:0;
 const midi=(Number(match[3])+1)*12+base+acc;
 if(midi<24||midi>84)throw Error('Open-string tuning notes must fall between C1 and C6 (MIDI 24–84).');
 return midi;
}
export function parseTuning(s){label(s,80,'Tuning');const notes=s.trim().split(/\s+/u);if(notes.length!==6)throw Error('Enter six open-string notes, in string 6 → 1 order.');return notes.map(parseNote);}
export function sounding(board,card){
 validate(board);validateCard(card);
 return card.frets.map((f,i)=>({string:6-i,fret:f,finger:card.fingers[i],openMidi:board.tuning[i],midi:f===null?null:board.tuning[i]+f,note:f===null?'muted':noteName(board.tuning[i]+f,board.spelling)}));
}
export function receipt(board){
 validate(board);return {schema:'voicingpad-receipt-v1',title:board.title,tuning:board.tuning.map(m=>noteName(m,board.spelling)),handed:board.handed,cards:board.cards.map(c=>({id:c.id,name:c.name,note:c.note,strings:sounding(board,c)}))};
}
