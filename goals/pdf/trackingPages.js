import {rgb} from '../vendor/pdf-lib.js';
import {actions} from '../domain/map.js';
import {currentMonth,monthDays,monthTitle,dayTitle,frequencyLabel,routineCount,weekday} from '../domain/tracking.js';

// Printed circles/check boxes are vector shapes; all tracking history is in the attachment.
export function drawTrackingPages({pdf,map,text,wrap,footer,W,H,M,ink,muted,line}) {
  const all=actions(map),chosen=new Set(map.priorityActionIds);
  const ordered=[...all].sort((a,b)=>Number(chosen.has(b.id))-Number(chosen.has(a.id)));
  const routines=ordered.filter(a=>a.type==='routine'),tasks=ordered.filter(a=>a.type==='deadline');
  let page,y,section='';
  function begin(title,subtitle=''){
    section=title.replace(/(?: \/ продолжение)+$/, '');page=pdf.addPage([W,H]);footer(page,pdf.getPageCount());
    text(page,title,M,H-49,20);y=H-78;
    if(subtitle){text(page,subtitle,M,y,11,muted);y-=31;}
  }
  function ensure(height){if(y-height<65)begin(section+' / продолжение');}
  function lines(t,size=12){for(const l of wrap(t,size,W-2*M)){ensure(size*1.5);text(page,l,M,y,size);y-=size*1.5;}y-=10;}
  if(tasks.length){
    begin('СДЕЛАТЬ ОДИН РАЗ','Отмечайте завершённые шаги. Ближайшие действия стоят первыми.');
    for(const a of tasks){const title=wrap(a.text,13,W-2*M-44);ensure(title.length*18+62);
      page.drawRectangle({x:M,y:y-14,width:17,height:17,borderColor:ink,borderWidth:1,color:a.completedOn?ink:rgb(1,1,1)});
      if(a.completedOn){page.drawLine({start:{x:M+4,y:y-5},end:{x:M+7,y:y-9},color:rgb(1,1,1),thickness:1.5});page.drawLine({start:{x:M+7,y:y-9},end:{x:M+14,y:y},color:rgb(1,1,1),thickness:1.5});}
      for(const l of title){text(page,l,M+31,y,13);y-=18;}
      const detail=`${chosen.has(a.id)?'Ближайшее · ':''}${a.deadline?'Срок: '+dayTitle(a.deadline):'Срок не задан'}${a.completedOn?' · Выполнено: '+dayTitle(a.completedOn):''}`;
      text(page,detail,M+31,y-2,10,muted);y-=30;
      page.drawLine({start:{x:M,y},end:{x:W-M,y},color:line,thickness:.5});y-=23;
    }
  }
  if(routines.length){
    const month=map.execution?.month||currentMonth(),days=monthDays(month);
    const subtitle=`${monthTitle(month)} · Заполненный кружок — день выполнения. Пустые дни можно оставить пустыми.`;
    const gap=34,colWidth=(W-2*M-gap)/2;
    for(let offset=0;offset<routines.length;){
      const candidates=routines.slice(offset,offset+4);
      const crowded=candidates.some(a=>wrap(a.text,12,colWidth).length>4||wrap(frequencyLabel(a)+(chosen.has(a.id)?' · Ближайшее':''),10,colWidth).length>1);
      const group=crowded?candidates.slice(0,2):candidates,large=group.length<=2,cardHeight=large?615:310;offset+=group.length;
      begin('ТРЕКЕРЫ ПОВТОРЕНИЙ',subtitle);
      group.forEach((a,index)=>{
        const x=M+(index%2)*(colWidth+gap),top=H-120-Math.floor(index/2)*330;
        page.drawLine({start:{x,y:top+12},end:{x:x+colWidth,y:top+12},color:ink,thickness:1});
        let cy=top-6;
        for(const l of wrap(a.text,12,colWidth)){text(page,l,x,cy,12);cy-=15;}
        for(const l of wrap(frequencyLabel(a)+(chosen.has(a.id)?' · Ближайшее':''),10,colWidth)){text(page,l,x,cy-3,10,muted);cy-=13;}
        cy-=19;
        const stepX=colWidth/7,stepY=large?Math.min(65,(cy-34-(top-cardHeight+133))/5):Math.min(28,(cardHeight-(top-cy)-45)/6),radius=large?16:9;
        ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach((v,i)=>text(page,v,x+(i+.5)*stepX-6,cy,9,muted));cy-=large?34:24;
        const first=weekday(days[0]);
        days.forEach((day,i)=>{const slot=first+i,cx=x+(slot%7+.5)*stepX,dy=cy-Math.floor(slot/7)*stepY,done=(a.checkIns||[]).includes(day);
          page.drawCircle({x:cx,y:dy,size:radius,borderWidth:.8,borderColor:done?ink:muted,color:done?ink:rgb(1,1,1)});
          const value=String(i+1);text(page,value,cx-(value.length===2?5:2.5),dy-3,9,done?rgb(1,1,1):ink);
        });
        const baseline=top-cardHeight+18;text(page,`Отмечено дней: ${routineCount(a,month)}`,x,baseline,10,muted);
        if(large){text(page,'Что помогает мне повторять это действие?',x,baseline+85,11,muted);for(let n=0;n<2;n++)page.drawLine({start:{x,y:baseline+59-n*25},end:{x:x+colWidth,y:baseline+59-n*25},color:line,thickness:.5});}
      });
      if(group.length===1){const x=M+colWidth+gap;let cy=H-128;
        text(page,'МОЙ РИТМ',x,cy,12);cy-=36;
        for(const prompt of ['Когда мне удобно это делать?','Что поможет начать в сложный день?','Как это действие приближает меня к цели?']){text(page,prompt,x,cy,12);cy-=32;for(let n=0;n<3;n++){page.drawLine({start:{x,y:cy},end:{x:x+colWidth,y:cy},color:line,thickness:.5});cy-=29;}cy-=24;}
      }
      text(page,'Показан выбранный месяц. История других месяцев также сохраняется внутри PDF для продолжения работы.',M,53,9,muted);
    }
  }
  begin('ЕЖЕНЕДЕЛЬНАЯ РЕВИЗИЯ','Вернитесь к цели, а затем выберите следующий посильный шаг.');
  lines(map.goal.text,17);
  lines(map.execution?.reviewDate?'Следующая встреча с целью: '+dayTitle(map.execution.reviewDate):'Следующая встреча с целью: ______________________________',12);
  if(map.execution?.lastReviewedOn)lines('Последняя ревизия: '+dayTitle(map.execution.lastReviewedOn),10);
  lines('Что получилось? Что помогло приблизиться к цели?',14);
  lines('Что мешало? Что стоит упростить, изменить или убрать?',14);
  lines('Какой один шаг вы сделаете дальше?',14);
  y-=15;
  if(map.execution?.reviewNote){lines('ВАШ ИТОГ И СЛЕДУЮЩИЙ ШАГ',11);lines(map.execution.reviewNote,13);}
  for(let i=0;i<4;i++){ensure(36);page.drawLine({start:{x:M,y:y-15},end:{x:W-M,y:y-15},color:line,thickness:.5});y-=36;}
  ensure(45);text(page,'После ревизии обновите ближайшие действия в карте. Выполненный чек-лист — повод свериться с результатом цели.',M,y-15,10,muted);
}
