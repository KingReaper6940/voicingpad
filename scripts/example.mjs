import {mkdir,writeFile} from 'node:fs/promises';import {example} from '../src/example.mjs';import {boardSvg,cardSvg} from '../src/diagram.mjs';import {receipt} from '../src/pitch.mjs';
const folder=new URL('../examples/',import.meta.url);await mkdir(folder,{recursive:true});
for(const [name,text] of Object.entries({'board.svg':boardSvg(example),'card.svg':cardSvg(example,example.cards[0]),'project.json':JSON.stringify(example,null,2)+'\n','pitches.json':JSON.stringify(receipt(example),null,2)+'\n'}))await writeFile(new URL(name,folder),text);
console.log('Generated 4 real outputs: 4 voicing cards, 24 string records; C shape pitches muted C3 E3 G3 C4 E4.');
