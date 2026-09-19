export const ATTACHMENT = 'deep-searching-goals-state.json';
export const MAX_PAYLOAD = 4 * 1024 * 1024;
export function serializeState(data) {
  return new TextEncoder().encode(JSON.stringify({format:'deep-searching-goals',schemaVersion:data.schemaVersion,data}));
}
export async function embedState(pdf, data) {
  const bytes = serializeState(data);
  if (bytes.length > MAX_PAYLOAD) throw new Error('Слишком много данных карты.');
  await pdf.attach(bytes, ATTACHMENT, {mimeType:'application/json', description:'Editable map state'});
}
