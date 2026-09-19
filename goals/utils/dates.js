export const now = () => new Date().toISOString();
export const displayDate = value => value ? new Intl.DateTimeFormat('ru',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value.slice(0,10)+'T12:00:00')) : '';
