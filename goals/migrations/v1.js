import {validateMap} from '../domain/validation.js';
export function migrateV1toV2(data,options){
 if(data?.schemaVersion!==1)throw new Error('Некорректная версия карты.');
 return validateMap({...data,schemaVersion:2},options);
}
export const readV1=migrateV1toV2;
