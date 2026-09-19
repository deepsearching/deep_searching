import {drawTrackingPages} from './trackingPages.js';
import {PDFDocument,rgb,PDFName,PDFString} from '../vendor/pdf-lib.js';
import '../vendor/fontkit.umd.js';
const fontkit=globalThis.fontkit;
import {embedState} from './embedState.js';
import {blocks} from '../domain/layout.js';
import {actions,sorted} from '../domain/map.js';
import {validateMap} from '../domain/validation.js';
export const FILENAME='цели_deep_searching.pdf';
const frequency={daily:'каждый день',several_times_week:'несколько раз в неделю',weekly:'раз в неделю'};
export function actionDetail(a){return a.type==='deadline'?(a.deadline?`Сделать до ${a.deadline}`:'Разовое действие'):a.type==='routine'?`Повторять: ${frequency[a.frequency?.type]||a.frequency?.value||'частота не задана'}`:'Пока идея';}
let fontBytes;
export async function generatePdf(input){
 const map=validateMap(structuredClone(input));
 fontBytes ||= fetch(new URL('../fonts/Regular.ttf',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Не удалось загрузить шрифт.');return r.arrayBuffer();}).catch(e=>{fontBytes=null;throw e;});
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(await fontBytes,{subset:true});
 pdf.setTitle('Цели — deep_searching');pdf.setAuthor('deep_searching');pdf.setLanguage('ru');await embedState(pdf,map);
 const ink=rgb(.125,.133,.13),muted=rgb(.32,.36,.39),line=rgb(.77,.81,.83),blue=rgb(.93,.96,.97),dark=rgb(.14,.34,.45);
 const chars=new Set(font.getCharacterSet()),pending=[];
 const supported=t=>[...t].every(c=>chars.has(c.codePointAt(0)));
 const width=(t,size)=>supported(t)?font.widthOfTextAtSize(t,size):[...t].reduce((w,c)=>w+(chars.has(c.codePointAt(0))?font.widthOfTextAtSize(c,size):size),0);
 function text(page,t,x,y,size=12,color=ink){if(!t)return;if(supported(t)){page.drawText(t,{x,y,size,font,color});return;}
   // Only unsupported text runs are rasterized (e.g. emoji); the document/grid remains vector.
   if(typeof document==='undefined')throw new Error('Для печати emoji нужен браузер.');
   const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');const w=width(t,size)+size*2;
   canvas.width=Math.ceil(w*3);canvas.height=Math.ceil(size*1.7*3);ctx.scale(3,3);ctx.font=`${size}px Arial, sans-serif`;ctx.fillStyle=`rgb(${Math.round(color.red*255)},${Math.round(color.green*255)},${Math.round(color.blue*255)})`;ctx.textBaseline='alphabetic';ctx.fillText(t,0,size*1.2,w);
   pending.push(pdf.embedPng(canvas.toDataURL('image/png')).then(img=>page.drawImage(img,{x,y:y-size*.5,width:w,height:size*1.7})));
 }
 function wrap(t,size,max){const out=[];for(const paragraph of t.replace(/\r/g,'').replace(/\n{2,}/g,'\n').trim().split('\n')){let current='';for(const word of paragraph.split(/\s+/)){if(!word)continue;const candidate=current?current+' '+word:word;if(width(candidate,size)<=max){current=candidate;continue;}if(current){out.push(current);current='';}for(const char of word){if(width(current+char,size)>max&&current){out.push(current);current='';}current+=char;}}out.push(current);}return out;}
 const W=1190.55,H=841.89,M=40;
 function footer(p,n){p.drawLine({start:{x:M,y:33},end:{x:W-M,y:33},thickness:.5,color:line});text(p,'deep_searching',M,18,9,muted);text(p,'Эту карту можно снова открыть и редактировать на deep_searching.',290,18,9,muted);text(p,String(n),W-50,18,9,muted);const link=pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[290,14,650,30],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of('https://deepsearching.github.io/deep_searching/')}});p.node.set(PDFName.of('Annots'),pdf.context.obj([pdf.context.register(link)]));}
 let page=pdf.addPage([W,H]);text(page,'ЦЕЛИ',M,H-48,20);text(page,'OPEN WINDOW 64 / инструмент метода Харады',W-355,H-44,10,muted);
 const heading=wrap(map.goal.text,18,W-2*M);let y=H-80;for(const l of heading){text(page,l,M,y,18);y-=22;}
 if(map.goal.targetDate){text(page,`Срок: ${map.goal.targetDate}`,M,y-1,11,muted);y-=19;}
 text(page,'Полные формулировки, контекст и ближайшие действия — на следующих страницах.',M,y-2,10,muted);y-=24;
 const gridHeight=y-62,cw=(W-2*M)/9,ch=gridHeight/9;
 for(const [bi,b] of blocks(map).entries()){const br=Math.floor(bi/3),bc=bi%3;for(const [ci,c] of b.cells.entries()){const x=M+(bc*3+ci%3)*cw,top=y-(br*3+Math.floor(ci/3))*ch;const center=ci===4,goal=c.kind==='goal';page.drawRectangle({x,y:top-ch,width:cw,height:ch,borderColor:line,borderWidth:.5,color:goal?dark:center?blue:rgb(1,1,1)});
 const label=c.entity?.text||'';let size=goal?12:center?11:10;let lines=wrap(label,size,cw-14);while(size>9&&lines.length*Math.ceil(size*1.25)>ch-15){size-=.5;lines=wrap(label,size,cw-14);}
 const maxLines=Math.max(1,Math.floor((ch-15)/(size*1.25)));if(lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines.at(-1);while(width(last+'…',size)>cw-14)last=last.slice(0,-1);lines[lines.length-1]=last+'…';}
 lines.forEach((l,i)=>text(page,l,x+7,top-12-size*.25-i*size*1.25,size,goal?rgb(1,1,1):ink));}
 page.drawRectangle({x:M+bc*3*cw,y:y-(br+1)*3*ch,width:3*cw,height:3*ch,borderWidth:1.2,borderColor:muted});}
 footer(page,1);
 function newPage(title){page=pdf.addPage([W,H]);text(page,title,M,H-50,19);y=H-85;footer(page,pdf.getPageCount());}
 function paragraph(t,size=12){for(const l of wrap(t,size,W-2*M)){if(y<65)newPage('ЦЕЛИ / продолжение');text(page,l,M,y,size);y-=size*1.5;}y-=8;}
 newPage('ОТ КАРТЫ — К ДЕЙСТВИЮ');paragraph(map.goal.text,18);paragraph('1. Выберите 1–3 посильных действия на ближайшую неделю.');paragraph('2. Отмечайте разовые шаги галочкой, повторения — кружочками по дням.');paragraph('3. Раз в неделю сверяйтесь с целью: что сработало и какой следующий шаг нужен?');if(map.goal.targetDate)paragraph(`Срок: ${map.goal.targetDate}`);if(map.goal.purpose)paragraph('Почему это важно: '+map.goal.purpose);
 const selected=actions(map).filter(a=>map.priorityActionIds.includes(a.id));
 if(!selected.length)paragraph('Ближайшие действия пока не выбраны. Их можно выбрать при следующем открытии карты.');
 for(const [type,title] of [['deadline','Сделать'],['routine','Повторять'],['idea','Пока определить']]){const group=selected.filter(a=>a.type===type);if(!group.length)continue;paragraph(title,16);for(const a of group)paragraph(`${a.text}\n${a.pillar.text} · ${actionDetail(a)}`);}
 drawTrackingPages({pdf,map,text,wrap,footer,W,H,M,ink,muted,line});
 newPage('ПОЛНАЯ КАРТА / формулировки');
 for(const p of sorted(map.pillars)){if(y<120)newPage('ПОЛНАЯ КАРТА / продолжение');paragraph(`${p.position+1}. ${p.text}`,16);if(!p.actions.length)paragraph('Действия пока не добавлены.');for(const a of sorted(p.actions))paragraph(`${p.position+1}.${a.position+1}. ${a.text}\n${actionDetail(a)}`);y-=12;}
 await Promise.all(pending);return pdf.save();
}
