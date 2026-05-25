import type { ItemData, ItemCategory } from './basicItemData';

export function colLetterToIndex(letter: string): number {
  return (letter.toUpperCase().codePointAt(0) ?? 65) - 65;
}

export function parseCategoryIds(
  values: string[][] | undefined,
  nameColIdx: number,
  idColIdx: number
): Map<string, number> {
  const map = new Map<string, number>();
  if (!values) return map;
  for (const row of values) {
    const name = row[nameColIdx];
    const id = Number.parseInt(row[idColIdx]);
    if (name && !Number.isNaN(id)) map.set(name, id);
  }
  return map;
}

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

interface ParseSheetResult {
  categories: Map<string, ItemCategory>;
  warnings: string[];
}

export function parseSheetRows(values: string[][] | undefined, categoryIds?: Map<string, number>): ParseSheetResult {
  const categories = new Map<string, ItemCategory>();
  const warnings: string[] = [];
  if (!values) return { categories, warnings };
  for (const row of values) {
    const cat: string = row[6];
    if (!categories.has(cat)) categories.set(cat, { name: cat, items: [], id: categoryIds?.get(cat) ?? 0 });
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
      value: isInteger(row[12]) ? Number.parseInt(row[12]) : (row[12] === "Priceless") ? "priceless" : undefined,
      date: parseDate(row[5]),
    };

    // Read additional donor emails from columns Q–U (indices 16–20)
    const additionalDonorEmails = [row[16], row[17], row[18], row[19], row[20]]
      .filter((e): e is string => typeof e === 'string' && e.trim() !== '')
      .map(e => e.trim());

    if (additionalDonorEmails.length > 0) {
      item.additionalDonorEmails = additionalDonorEmails;

      // Check for duplicates (case-insensitive)
      const primaryLower = (item.donorEmail ?? '').toLowerCase();
      const seen = new Set<string>(primaryLower ? [primaryLower] : []);
      for (const email of additionalDonorEmails) {
        const lower = email.toLowerCase();
        if (seen.has(lower)) {
          warnings.push(`Item "${item.name}": duplicate donor email "${email}"`);
        } else {
          seen.add(lower);
        }
      }
    }

    categories.get(cat)?.items.push(item);
  }
  return { categories, warnings };
}
