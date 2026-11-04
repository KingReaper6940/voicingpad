import {LIMITS,clone} from './model.mjs';
export function readProject(text){
 if(typeof text!=='string'||text.length>LIMITS.source)throw Error('Project text must be at most 30,000 UTF-16 units.');
 return clone(JSON.parse(text));
}
export async function readFile(file){
 if(!file||!Number.isSafeInteger(file.size)||file.size>LIMITS.file)throw Error('Choose a UTF-8 JSON project up to 120,000 bytes.');
 const bytes=await file.arrayBuffer();if(bytes.byteLength>LIMITS.file)throw Error('File exceeds 120,000 bytes.');
 return readProject(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export function attachFiles(doc,app){
 const input=doc.getElementById('file');let pending=0;
 input.addEventListener('change',async()=>{
 const file=input.files?.[0];if(!file)return;const token=++pending,revision=app.revision;
 try{const board=await readFile(file);if(token!==pending)return;
 if(app.revision!==revision){app.say('File not applied: the board or a draft changed while it was being read.');return;}
 app.load(board);
 }catch(e){if(token===pending)app.say('File not applied: '+e.message,true);}
 finally{if(token===pending)input.value='';}
 });
}
