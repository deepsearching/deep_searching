import {migrate} from '../migrations/index.js';
export const KEY='deep_searching_goals_v1';
export function loadLibrary(storage=localStorage){const raw=storage.getItem(KEY);if(!raw)return {maps:[],activeMapId:null};const value=JSON.parse(raw);if(!Array.isArray(value.maps))throw new Error('Не удалось прочитать локальную библиотеку.');const maps=value.maps.map(m=>migrate({format:m.format,schemaVersion:m.schemaVersion,data:m},{allowDraft:true}));if(new Set(maps.map(m=>m.id)).size!==maps.length)throw new Error('Повторяющиеся карты в библиотеке.');return {maps,activeMapId:maps.some(m=>m.id===value.activeMapId)?value.activeMapId:null};}
export function saveLibrary(library,storage=localStorage){storage.setItem(KEY,JSON.stringify(library));}
export const conflictInfo=(existing,incoming)=>({existing,incoming,newer:Date.parse(existing.updatedAt)>Date.parse(incoming.updatedAt)?'device':Date.parse(existing.updatedAt)<Date.parse(incoming.updatedAt)?'pdf':'same'});
