export const STANDARD=Object.freeze([40,45,50,55,59,64]);
export const LIMITS=Object.freeze({cards:24,source:30000,file:120000});
export function label(s,max,name){if(typeof s!=='string'||s.length>max||!s.isWellFormed()||/[\u0000-\u001f\u007f\u2028\u2029]/u.test(s))throw Error(name+' must be single-line Unicode text, at most '+max+' UTF-16 units.');return s;}
function fields(obj,keys){if(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).sort().join(',')!==keys.sort().join(','))throw Error('Unsupported project fields.');}
export function windowFor(frets){
 const positive=frets.filter(f=>f!==null&&f>0),min=positive.length?Math.min(...positive):1,max=positive.length?Math.max(...positive):1;
 if(max-min>4)throw Error('Fretted notes must fit within five consecutive frets. Open and muted strings do not affect the window.');
 return {start:max<=5?1:min,rows:5};
}
export function validateCard(c){
 fields(c,['id','name','note','frets','fingers']);
 if(typeof c.id!=='string'||!/^v[1-9]\d{0,8}$/.test(c.id))throw Error('Invalid voicing identity.');
 label(c.name,40,'Card name');label(c.note,120,'Card note');
 if(!Array.isArray(c.frets)||c.frets.length!==6||c.frets.some(f=>f!==null&&(!Number.isInteger(f)||f<0||f>24)))throw Error('Use six frets: x for muted, or integers 0–24.');
 if(!Array.isArray(c.fingers)||c.fingers.length!==6||c.fingers.some((f,i)=>f!==null&&(!Number.isInteger(f)||f<1||f>4||c.frets[i]===null||c.frets[i]===0)))throw Error('Fingers are 1–4 on fretted strings only; use - otherwise.');
 windowFor(c.frets);return c;
}
export function validate(board){
 fields(board,['schema','title','tuning','spelling','handed','cards']);
 if(board.schema!=='voicingpad-project-v1')throw Error('Unsupported project version.');
 label(board.title,80,'Board title');
 if(!Array.isArray(board.tuning)||board.tuning.length!==6||board.tuning.some(m=>!Number.isInteger(m)||m<24||m>84))throw Error('Use six open-string MIDI pitches from 24 to 84.');
 if(!['sharps','flats'].includes(board.spelling)||!['right','left'].includes(board.handed))throw Error('Invalid spelling or diagram orientation.');
 if(!Array.isArray(board.cards)||board.cards.length<1||board.cards.length>LIMITS.cards)throw Error('Keep 1–24 voicing cards.');
 const ids=new Set();for(const c of board.cards){validateCard(c);if(ids.has(c.id))throw Error('Voicing IDs must be unique.');ids.add(c.id);}
 return board;
}
export const clone=board=>structuredClone(validate(board));
export function parseFrets(s){label(s,100,'Fret entry');const tokens=s.trim().split(/\s+/u);if(tokens.length!==6||tokens.some(t=>!/^([xX]|0|[1-9]|1\d|2[0-4])$/.test(t)))throw Error('Enter six space-separated frets, x or 0–24, in string 6 → 1 order.');return tokens.map(t=>/^x$/i.test(t)?null:Number(t));}
export function parseFingers(s){label(s,100,'Finger entry');const tokens=s.trim().split(/\s+/u);if(tokens.length!==6||tokens.some(t=>!/^[-1-4]$/.test(t)))throw Error('Enter six finger labels: - or 1–4.');return tokens.map(t=>t==='-'?null:Number(t));}
export const fretText=c=>c.frets.map(f=>f===null?'x':String(f)).join(' ');
export const fingerText=c=>c.fingers.map(f=>f===null?'-':String(f)).join(' ');
