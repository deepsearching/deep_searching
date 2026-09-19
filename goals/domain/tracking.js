// Dates represent the user's local calendar, never UTC midnight or elapsed hours.
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function shiftDay(day, amount) {
  const [y,m,d]=day.split('-').map(Number);
  return localDay(new Date(y,m-1,d+amount,12));
}
export const currentMonth = () => localDay().slice(0,7);
export function shiftMonth(month, amount) {
  const [y,m]=month.split('-').map(Number);
  return localDay(new Date(y,m-1+amount,1,12)).slice(0,7);
}
export function monthDays(month) {
  const [y,m]=month.split('-').map(Number);
  return Array.from({length:new Date(y,m,0,12).getDate()},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`);
}
export const monthTitle = month => new Intl.DateTimeFormat('ru',{month:'long',year:'numeric'}).format(new Date(`${month}-01T12:00:00`));
export const dayTitle = day => new Intl.DateTimeFormat('ru',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${day}T12:00:00`));
export const weekday = day => (new Date(`${day}T12:00:00`).getDay()+6)%7;
export const routineCount = (action,month) => (action.checkIns||[]).filter(day=>day.startsWith(month+'-')).length;
export function findAction(map,id) {
  const action=map.pillars.flatMap(p=>p.actions).find(a=>a.id===id);
  if(!action) throw new Error('Действие не найдено.');
  return action;
}
export function toggleCheckIn(map,id,day,today=localDay()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)throw new Error('Некорректная дата.');
  if(day>today)throw new Error('Будущий день пока нельзя отметить.');
  const action=findAction(map,id);
  if(action.type!=='routine')throw new Error('Это не регулярное действие.');
  const days=new Set(action.checkIns||[]);
  if(days.has(day))days.delete(day);
  else {if(days.size>=3660)throw new Error('В этом трекере уже 3660 отметок. Сохраните историю в PDF.');days.add(day);}
  action.checkIns=[...days].sort();
}
export function toggleDone(map,id,today=localDay()) {
  const action=findAction(map,id);
  if(action.type!=='deadline')throw new Error('Это не разовое действие.');
  if(action.completedOn)delete action.completedOn;else action.completedOn=today;
}
export function finishWeeklyReview(map,today=localDay()) {
  map.execution={...map.execution,lastReviewedOn:today,reviewDate:shiftDay(today,7)};
}
export function frequencyLabel(action) {
  return {daily:'Каждый день',several_times_week:'Несколько раз в неделю',weekly:'Раз в неделю',custom:action.frequency?.value||'Свой ритм'}[action.frequency?.type]||'Ритм пока не задан';
}
export function actionBadge(action) {
  if(action.type==='routine')return action.frequency?.type==='daily'?'Ежедневно':'Повторять';
  if(action.type==='deadline')return action.completedOn?'Выполнено':'Разово';
  return 'Идея';
}
