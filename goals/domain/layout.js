// One canonical entity, multiple projections. Positions never compact after deletion.
export const SLOTS=[0,1,2,3,5,6,7,8];
export function blockCells(map,position=null){const p=position===null?null:map.pillars.find(p=>p.position===position);return Array.from({length:9},(_,i)=>{if(i===4)return {kind:position===null?'goal':'pillar',entity:position===null?map.goal:p,position};const pos=SLOTS.indexOf(i);return {kind:position===null?'pillar':'action',position:pos,entity:(position===null?map.pillars:p?.actions||[]).find(e=>e.position===pos),pillar:p};});}
export function blocks(map){return Array.from({length:9},(_,i)=>({position:i===4?null:SLOTS.indexOf(i),cells:blockCells(map,i===4?null:SLOTS.indexOf(i))}));}
