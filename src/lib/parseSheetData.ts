import type { ItemData, ItemCategory } from './basicItemData';

const isInteger = (s: string): boolean => !isNaN(parseInt(s, 10));
const isDate = (s: string): boolean => !isNaN(Date.parse(s));

export function parseSheetRows(values: string[][] | undefined): Map<string, ItemCategory> {
  const categories = new Map<string, ItemCategory>();
  if (!values) return categories;
  for (const row of values) {
    const cat: string = row[7];
    if (!categories.has(cat)) categories.set(cat, { name: cat, items: [] });
    const item: ItemData = {
      name: row[0],
      itemNumber: Number.parseInt(row[2]),
      description: row[4],
      details: row[5],
      donorName: row[8],
      donorEmail: row[9],
      donorDisplay: row[10],
      quantity: Number.parseInt(row[11]),
      quantityNotes: row[12],
      minBid: Number.parseInt(row[14]),
      bidIncrement: Number.parseInt(row[15]),
      bidSheetType: row[16],
      value: isInteger(row[13]) ? Number.parseInt(row[13]) : undefined,
      date: isDate(row[6]) ? new Date(row[6]) : undefined,
    };
    categories.get(cat)?.items.push(item);
  }
  return categories;
}
