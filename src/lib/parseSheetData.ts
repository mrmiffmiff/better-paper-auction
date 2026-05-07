import type { ItemData, ItemCategory } from './basicItemData';

const isInteger = (s: string): boolean => !isNaN(parseInt(s, 10));
// Require a recognizable date format so freeform text like "Spring 2025" stays as a string
const isDate = (s: string): boolean =>
    (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(s) ||     // ISO: 2025-06-01
     /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s) ||    // US short: 6/1/2025
     /^[A-Za-z]+ \d{1,2},? \d{4}$/.test(s)) &&   // Long: June 1, 2025
    !Number.isNaN(Date.parse(s));
function parseDate(s: string): Date | string | undefined {
  if (s === '') return undefined;
  return isDate(s) ? new Date(s) : s;
}

export function parseSheetRows(values: string[][] | undefined): Map<string, ItemCategory> {
  const categories = new Map<string, ItemCategory>();
  if (!values) return categories;
  for (const row of values) {
    const cat: string = row[6];
    if (!categories.has(cat)) categories.set(cat, { name: cat, items: [] });
    const item: ItemData = {
      name: row[0],
      itemNumber: Number.parseInt(row[2]),
      description: row[3],
      details: row[4],
      donorName: row[7],
      donorEmail: row[8],
      donorDisplay: row[9],
      quantity: Number.parseInt(row[10]),
      quantityNotes: row[11],
      minBid: Number.parseInt(row[13]),
      bidIncrement: Number.parseInt(row[14]),
      bidSheetType: row[15],
      value: isInteger(row[12]) ? Number.parseInt(row[12]) : undefined,
      date: parseDate(row[5]),
    };
    categories.get(cat)?.items.push(item);
  }
  return categories;
}
