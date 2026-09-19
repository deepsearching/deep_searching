import {extractState} from '../pdf/extractState.js';
import {migrate} from '../migrations/index.js';
export const importPdf=async bytes=>migrate(await extractState(bytes));
export const importMessages={
 'unknown-format':'В этом PDF нет данных карты deep_searching. Для восстановления нужен PDF, который был сохранён через этот инструмент.',
 'unsupported-version':'Эта карта была создана другой версией инструмента. Эта версия пока не поддерживается.',
 'corrupted':'Данные карты прочитать не удалось. Возможно, файл повреждён. Попробуйте другой сохранённый PDF.',
 'too-large':'Этот файл слишком большой. Выберите PDF размером до 15 МБ.'};
