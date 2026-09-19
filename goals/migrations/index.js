import {migrateV1toV2} from './v1.js';
import {validateMap} from '../domain/validation.js';
import {ImportError} from '../pdf/extractState.js';
export function migrate(payload,options){
 if(payload?.format!=='deep-searching-goals')throw new ImportError('unknown-format');
 if(![1,2].includes(payload.schemaVersion))throw new ImportError('unsupported-version');
 try{if(payload.data?.schemaVersion!==payload.schemaVersion)throw new Error();return payload.schemaVersion===1?migrateV1toV2(payload.data,options):validateMap(payload.data,options);}
 catch{throw new ImportError('corrupted');}
}
