import {FORMAT,STATES,LIMITS} from './map.js';
export class ValidationError extends Error{}
const fail=()=>{throw new ValidationError('Некорректные данные карты.');};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:fail();
const str=(v,max,required=false)=>typeof v==='string'&&v.length<=max&&(!required||v.trim())?v:fail();
const date=v=>{str(v,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail();return v;};
const stamp=v=>{str(v,40,true);if(!Number.isFinite(Date.parse(v)))fail();return v;};
const list=(v,n)=>Array.isArray(v)&&v.length<=n?v:fail();
export function validateMap(raw,{allowDraft=false}={}){
 const r=object(raw);if(r.format!==FORMAT||r.schemaVersion!==2||!STATES.includes(r.onboardingState))fail();
 const ids=new Set();const uid=v=>{str(v,100,true);if(ids.has(v))fail();ids.add(v);return v;};
 const goal=object(r.goal);const g={text:str(goal.text,LIMITS.goal,!allowDraft)};
 if(goal.targetDate!==undefined)g.targetDate=date(goal.targetDate);if(goal.purpose!==undefined)g.purpose=str(goal.purpose,LIMITS.purpose);
 const m={format:FORMAT,schemaVersion:2,id:uid(r.id),createdAt:stamp(r.createdAt),updatedAt:stamp(r.updatedAt),onboardingState:r.onboardingState,goal:g,pillars:[],priorityActionIds:[]};
 function positions(items){const used=new Set();return items.map(v=>{object(v);if(!Number.isInteger(v.position)||v.position<0||v.position>7||used.has(v.position))fail();used.add(v.position);return v;});}
 m.pillars=positions(list(r.pillars,8)).map(p=>({id:uid(p.id),position:p.position,text:str(p.text,LIMITS.pillar,true),actions:positions(list(p.actions,8)).map(a=>{const action={id:uid(a.id),position:a.position,text:str(a.text,LIMITS.action,true),type:a.type??'idea'};if(!['idea','deadline','routine'].includes(action.type))fail();if(a.deadline!==undefined)action.deadline=date(a.deadline);if(a.frequency!==undefined){const f=object(a.frequency);if(!['daily','several_times_week','weekly','custom'].includes(f.type))fail();action.frequency={type:f.type};if(f.value!==undefined)action.frequency.value=str(f.value,LIMITS.frequency);}if(a.completedOn!==undefined)action.completedOn=date(a.completedOn);
 if(a.checkIns!==undefined){const days=list(a.checkIns,3660).map(date);if(new Set(days).size!==days.length)fail();action.checkIns=[...days];}
 return action;})}));
 const actionIds=new Set(m.pillars.flatMap(p=>p.actions.map(a=>a.id)));const selected=list(r.priorityActionIds,10);if(new Set(selected).size!==selected.length||selected.some(id=>!actionIds.has(id)))fail();m.priorityActionIds=[...selected];
 if(r.activePillarId!==undefined){if(!m.pillars.some(p=>p.id===r.activePillarId))fail();m.activePillarId=r.activePillarId;}
 if(r.contextStep!==undefined){if(![0,1].includes(r.contextStep))fail();m.contextStep=r.contextStep;}
 if(r.reviewStep!==undefined){if(![0,1,2].includes(r.reviewStep))fail();m.reviewStep=r.reviewStep;}
 if(r.execution!==undefined){const x=object(r.execution),execution={};
 if(x.month!==undefined){str(x.month,7,true);date(x.month+'-01');execution.month=x.month;}
 for(const key of ['reviewDate','lastReviewedOn'])if(x[key]!==undefined)execution[key]=date(x[key]);
 if(x.reviewNote!==undefined)execution.reviewNote=str(x.reviewNote,1000);
 m.execution=execution;}
 return m;
}
