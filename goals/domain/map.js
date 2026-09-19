import {id} from '../utils/ids.js';
import {now} from '../utils/dates.js';
export const FORMAT='deep-searching-goals';
export const STATES=['START','GOAL','CONTEXT','PILLARS','MAP_REVEAL','ACTIONS','REVIEW','PRIORITIES','COMPLETE'];
export const LIMITS={goal:300,purpose:1000,pillar:200,action:300,frequency:100};
export function createMap(){return {format:FORMAT,schemaVersion:2,id:id(),createdAt:now(),updatedAt:now(),onboardingState:'GOAL',goal:{text:''},pillars:[],priorityActionIds:[]};}
export const sorted = items => [...items].sort((a,b)=>a.position-b.position);
export const actions = map => sorted(map.pillars).flatMap(p=>sorted(p.actions).map(a=>({...a,pillar:p})));
const positionCheck=position=>{if(!Number.isInteger(position)||position<0||position>7)throw new Error('Позиция должна быть от 0 до 7.');};
export function setPillar(map,position,text){positionCheck(position);let p=map.pillars.find(p=>p.position===position);if(!p){p={id:id(),position,text,actions:[]};map.pillars.push(p);}else p.text=text;return p;}
export function setAction(map,pillarId,position,text){positionCheck(position);const p=map.pillars.find(p=>p.id===pillarId);let a=p.actions.find(a=>a.position===position);if(!a){a={id:id(),position,text,type:'idea'};p.actions.push(a);}else a.text=text;return a;}
export function deleteAction(map,pillarId,actionId){const p=map.pillars.find(p=>p.id===pillarId);p.actions=p.actions.filter(a=>a.id!==actionId);map.priorityActionIds=map.priorityActionIds.filter(id=>id!==actionId);}
export function deletePillar(map,pillarId){const p=map.pillars.find(p=>p.id===pillarId);if(!p)return;const ids=new Set(p.actions.map(a=>a.id));map.pillars=map.pillars.filter(p=>p.id!==pillarId);map.priorityActionIds=map.priorityActionIds.filter(id=>!ids.has(id));if(map.activePillarId===pillarId)delete map.activePillarId;}
export function togglePriority(map,actionId){if(map.priorityActionIds.includes(actionId))map.priorityActionIds=map.priorityActionIds.filter(id=>id!==actionId);else{if(map.priorityActionIds.length>=10)throw new Error('Можно выбрать до 10 действий. Снимите выбор с одного из пунктов.');if(!actions(map).some(a=>a.id===actionId))throw new Error('Действие не найдено.');map.priorityActionIds.push(actionId);}}
export function copyMap(map){return {...structuredClone(map),id:id(),createdAt:now(),updatedAt:now()};}
