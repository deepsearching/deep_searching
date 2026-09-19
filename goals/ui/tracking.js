import {el,button,row,field} from './dom.js';
import {actions} from '../domain/map.js';
import {localDay,currentMonth,shiftMonth,monthDays,monthTitle,dayTitle,weekday,routineCount,toggleCheckIn,toggleDone,findAction,frequencyLabel,finishWeeklyReview,shiftDay} from '../domain/tracking.js';

export function routineTracker(map,actionId,{onChange,onError,month,compact=false,onMonthChange}={}) {
  let shownMonth=month||map.execution?.month||currentMonth();
  const root=el('section',{class:`routine-tracker ${compact?'compact-tracker':''}`,'aria-label':'Трекер повторений'});
  function changeMonth(value){shownMonth=value;if(onMonthChange){onMonthChange(value);return;}map.execution={...map.execution,month:value};onChange?.();draw();}
  function draw(focusDay){
    const action=findAction(map,actionId),days=monthDays(shownMonth),today=localDay();
    const dates=el('div',{class:'tracker-calendar'});
    for(const name of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])dates.append(el('span',{class:'weekday','aria-hidden':'true'},name));
    for(let n=0;n<weekday(days[0]);n++)dates.append(el('span',{'aria-hidden':'true'}));
    for(const day of days){const checked=(action.checkIns||[]).includes(day);dates.append(button('',()=>{
      try{toggleCheckIn(map,actionId,day);onChange?.();draw(day);}catch(e){onError?.(e.message);}
    },`day-button ${checked?'is-checked':''} ${day===today?'is-today':''}`,{
      disabled:day>today,'aria-pressed':checked?'true':'false','aria-current':day===today?'date':undefined,
      'aria-label':`${dayTitle(day)} — ${checked?'выполнено, снять отметку':'отметить выполнение'}`,'data-day':day
    }));dates.lastChild.append(el('span',{class:'day-circle','aria-hidden':'true'},Number(day.slice(-2))));}
    root.replaceChildren(el('div',{class:'tracker-caption'},el('span',{class:'tracker-frequency'},frequencyLabel(action)),el('span',{class:'small',role:'status'},`Отмечено дней: ${routineCount(action,shownMonth)}`)),
      el('div',{class:'month-navigation'},button('←',()=>{changeMonth(shiftMonth(shownMonth,-1));},'plain',{'aria-label':'Предыдущий месяц'}),el('span',{},monthTitle(shownMonth)),button('→',()=>{changeMonth(shiftMonth(shownMonth,1));},'plain',{'aria-label':'Следующий месяц',disabled:shownMonth>=currentMonth()})),dates,
      el('p',{class:'tracker-note'},'Кружок — день, когда вы это сделали. Пустые дни можно оставить пустыми.'));
    if(focusDay)root.querySelector(`[data-day="${focusDay}"]`)?.focus({preventScroll:true});
  }
  draw();return root;
}

export function completionToggle(map,actionId,onChange) {
  const action=findAction(map,actionId),input=el('input',{type:'checkbox',checked:!!action.completedOn,'aria-label':`Выполнено: ${action.text}`});
  const text=el('span',{},action.completedOn?`Выполнено ${dayTitle(action.completedOn)}`:'Отметить выполнение');
  const root=el('label',{class:'completion-toggle'},input,text);
  input.onchange=()=>{toggleDone(map,actionId);onChange?.();text.textContent=action.completedOn?`Выполнено ${dayTitle(action.completedOn)}`:'Отметить выполнение';};
  return root;
}

export function executionPanel(map,{onChange,onError,onEdit,onChoose,onReview}) {
  const all=actions(map),selected=new Set(map.priorityActionIds),today=localDay();
  const ordered=[...all].sort((a,b)=>Number(selected.has(b.id))-Number(selected.has(a.id)));
  const routines=ordered.filter(a=>a.type==='routine'),tasks=ordered.filter(a=>a.type==='deadline'),ideas=ordered.filter(a=>a.type==='idea');
  const root=el('section',{id:'execution',class:'execution'});
  const heading=el('div',{class:'section-heading'},el('h2',{},'От карты — к действию'),el('span',{},'Один шаг за раз'));
  root.append(heading,el('p',{class:'lead'},'Карта показывает путь. Теперь выберите несколько шагов, повторяйте важное и возвращайтесь к цели раз в неделю.'),
    el('ol',{class:'next-steps'},
      el('li',{},el('strong',{},'Выберите фокус'),el('p',{},'Начните с 1–3 действий, которые реально сделать на этой неделе.'),button(selected.size?'Изменить ближайшие действия':'Выбрать ближайшие действия',onChoose,'plain')),
      el('li',{},el('strong',{},'Действуйте и отмечайте'),el('p',{},'Разовый шаг закройте галочкой. В трекере повторений отмечайте дни, когда сделали действие.')),
      el('li',{},el('strong',{},'Проверьте результат'),el('p',{},'Раз в неделю посмотрите: что приблизило к цели и какой следующий шаг нужен?'))));
  if(!all.length)root.append(el('p',{class:'muted'},'Сначала добавьте хотя бы одно действие в любое направление карты ниже.'));
  const chooseBadge=a=>selected.has(a.id)?el('span',{class:'focus-tag'},'Ближайшее'):null;
  if(tasks.length){const list=el('section',{class:'task-checklist'},el('h3',{},'Сделать один раз'),el('p',{class:'small'},'Ближайшие действия стоят первыми. Сроки можно изменить в редакторе.'));
    for(const a of tasks)list.append(el('article',{class:'task-item'},el('div',{},chooseBadge(a),button(a.text,()=>onEdit(a),'text-button action-title'),el('p',{class:'small'},a.pillar.text),el('p',{class:'small'},a.deadline?`Сделать до ${dayTitle(a.deadline)}${!a.completedOn&&a.deadline<today?' · срок прошёл, пересмотрите план':''}`:'Срок пока не задан')),completionToggle(map,a.id,onChange)));
    root.append(list);
  }
  if(routines.length){
    const section=el('section',{class:'routine-section'},el('div',{class:'tracker-section-title'},el('div',{},el('h3',{},'Повторять'),el('p',{class:'small'},'У каждого действия свой ритм. Отмечайте фактические выполнения, без обязательства заполнить все кружочки.'))));
    const calendars=el('div',{class:'routine-cards'});
    const monthInput=el('input',{type:'month',value:map.execution?.month||currentMonth(),'aria-label':'Месяц трекеров и PDF',max:currentMonth()});
    function drawCalendars(){calendars.replaceChildren(...routines.map(a=>el('article',{class:'routine-card'},chooseBadge(a),button(a.text,()=>onEdit(a),'text-button action-title'),el('p',{class:'small'},a.pillar.text),routineTracker(map,a.id,{month:map.execution?.month,onChange,onError,onMonthChange:value=>{monthInput.value=value;map.execution={...map.execution,month:value};onChange();drawCalendars();}}))));}
    monthInput.onchange=()=>{if(!/^\d{4}-\d{2}$/.test(monthInput.value)||monthInput.value>currentMonth()){monthInput.value=map.execution?.month||currentMonth();return;}map.execution={...map.execution,month:monthInput.value};onChange();drawCalendars();};
    section.append(el('label',{class:'field tracker-month-field'},el('span',{},'Месяц трекеров и печатного PDF'),monthInput),calendars);drawCalendars();root.append(section);
  }
  if(ideas.length){root.append(el('details',{class:'ideas-to-clarify'},el('summary',{},`Пока идеи · ${ideas.length}`),el('p',{},'Выберите одну идею и сформулируйте ближайшее наблюдаемое действие. Затем задайте тип: разовый шаг или повторение.'),...ideas.map(a=>el('div',{class:'idea-item'},chooseBadge(a),button(a.text,()=>onEdit(a),'text-button'),button('Уточнить действие',()=>onEdit(a),'plain')))));}
  const reviewStatus=el('p',{class:'small',role:'status'},map.execution?.lastReviewedOn?`Последняя ревизия: ${dayTitle(map.execution.lastReviewedOn)}`:'Можно начать с короткой заметки.');
  const dateField=field('Когда вернуться к цели','date',map.execution?.reviewDate||'',value=>{map.execution={...map.execution};if(value)map.execution.reviewDate=value;else delete map.execution.reviewDate;onChange();});
  root.append(el('section',{class:'weekly-review'},el('p',{class:'eyebrow'},'ЕЖЕНЕДЕЛЬНАЯ ПАУЗА'),el('h3',{},'Что действительно сдвинулось?'),el('p',{},'Что получилось? Что мешало? Какой один шаг вы сделаете дальше? Отметки помогают вспомнить работу; результат сверяйте с самой целью.'),field('Итог недели и следующий шаг','textarea',map.execution?.reviewNote||'',value=>{map.execution={...map.execution,reviewNote:value};onChange();},1000),dateField,reviewStatus,row(button('Подвести итог недели',()=>{finishWeeklyReview(map);onChange();dateField.querySelector('input').value=map.execution.reviewDate;reviewStatus.textContent=`Итог отмечен. Следующая ревизия: ${dayTitle(map.execution.reviewDate)}`;},'primary'),button('Пересмотреть карту',onReview)),el('p',{class:'small'},'Эта дата — ориентир в карте. Уведомления не отправляются.')));
  return root;
}
