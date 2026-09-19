import {PDFDocument,PDFName,PDFDict,PDFArray,PDFRawStream} from '../vendor/pdf-lib.js';
import {ATTACHMENT,MAX_PAYLOAD} from './embedState.js';
export class ImportError extends Error { constructor(code) {super(code); this.code=code;} }
export const MAX_PDF = 15 * 1024 * 1024;
export async function extractState(bytes) {
  if (bytes.byteLength > MAX_PDF) throw new ImportError('too-large');
  try {
    const pdf = await PDFDocument.load(bytes,{updateMetadata:false});
    const names = pdf.catalog.lookupMaybe(PDFName.of('Names'),PDFDict);
    const embedded = names?.lookupMaybe(PDFName.of('EmbeddedFiles'),PDFDict);
    let found;
    const visited = new Set();
    function walk(tree, depth=0) {
      if (!tree || visited.has(tree) || depth>8) return;
      visited.add(tree);
      const list = tree.lookupMaybe(PDFName.of('Names'),PDFArray);
      if(list) for(let i=0;i<list.size();i+=2) {
        if(list.lookup(i)?.decodeText?.() !== ATTACHMENT) continue;
        const spec = list.lookup(i+1,PDFDict);
        const ef = spec.lookup(PDFName.of('EF'),PDFDict);
        found = ef.lookup(PDFName.of('F'),PDFRawStream);
      }
      const kids = tree.lookupMaybe(PDFName.of('Kids'),PDFArray);
      if(kids) for(let i=0;i<Math.min(kids.size(),32);i++) walk(kids.lookup(i,PDFDict),depth+1);
    }
    walk(embedded);
    if(!found) throw new ImportError('unknown-format');
    // Our attachments use FlateDecode. Streaming decompression bounds inflated data.
    let content=found.contents;
    if(content.length>MAX_PAYLOAD) throw new ImportError('corrupted');
    const filter=found.dict.get(PDFName.of('Filter'));
    if(filter) {
      if(filter.toString()!=='/FlateDecode') throw new ImportError('corrupted');
      const reader=new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
      const chunks=[]; let size=0;
      for(;;) {const {done,value}=await reader.read(); if(done) break; size+=value.length;
        if(size>MAX_PAYLOAD){await reader.cancel();throw new ImportError('corrupted');} chunks.push(value);}
      content=new Uint8Array(size); let offset=0; for(const c of chunks){content.set(c,offset);offset+=c.length;}
    }
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(content));
  } catch(e) {if(e instanceof ImportError) throw e; throw new ImportError('corrupted');}
}
