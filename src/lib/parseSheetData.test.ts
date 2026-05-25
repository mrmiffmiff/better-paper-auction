import { describe, it, expect } from 'vitest'
import { parseSheetRows } from './parseSheetData'

function makeRow(overrides: Partial<Record<number, string>> = {}): string[] {
  const row = [
    'ItemName', '', '42', 'A description', 'Details', '2025-06-01', 'CategoryA',
    'Donor Co', 'donor@example.com', 'Donor Co', '3', 'qty notes', '100', '50', '10', 'auction',
    // cols 16-20 (Q-U): additional donor emails — empty by default
    '', '', '', '', '',
  ];
  Object.entries(overrides).forEach(([i, v]) => { if (v !== undefined) row[Number(i)] = v; });
  return row;
}

describe('parseSheetRows', () => {
  it('returns empty categories and no warnings for undefined input', () => {
    const { categories, warnings } = parseSheetRows(undefined);
    expect(categories.size).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it('returns empty categories and no warnings for empty array', () => {
    const { categories, warnings } = parseSheetRows([]);
    expect(categories.size).toBe(0);
    expect(warnings).toHaveLength(0);
  });

  it('maps a single row to its category', () => {
    const { categories } = parseSheetRows([makeRow()]);
    expect(categories.size).toBe(1);
    expect(categories.has('CategoryA')).toBe(true);
    expect(categories.get('CategoryA')!.items).toHaveLength(1);
  });

  it('maps all required fields to the correct columns', () => {
    const row = makeRow();
    const item = parseSheetRows([row]).categories.get('CategoryA')!.items[0];
    expect(item.name).toBe('ItemName');
    expect(item.itemNumber).toBe(42);
    expect(item.description).toBe('A description');
    expect(item.details).toBe('Details');
    expect(item.donorName).toBe('Donor Co');
    expect(item.donorEmail).toBe('donor@example.com');
    expect(item.donorDisplay).toBe('Donor Co');
    expect(item.quantity).toBe(3);
    expect(item.quantityNotes).toBe('qty notes');
    expect(item.minBid).toBe(50);
    expect(item.bidIncrement).toBe(10);
    expect(item.bidSheetType).toBe('auction');
  });

  it('parses value as number when row[12] is an integer string', () => {
    const item = parseSheetRows([makeRow({ 12: '250' })]).categories.get('CategoryA')!.items[0];
    expect(item.value).toBe(250);
  });

  it('leaves value undefined when row[12] is not an integer', () => {
    const item = parseSheetRows([makeRow({ 12: 'N/A' })]).categories.get('CategoryA')!.items[0];
    expect(item.value).toBeUndefined();
  });

  it('leaves value undefined when row[12] is empty string', () => {
    const item = parseSheetRows([makeRow({ 12: '' })]).categories.get('CategoryA')!.items[0];
    expect(item.value).toBeUndefined();
  });

  it('parses date when row[5] is a valid date string', () => {
    const item = parseSheetRows([makeRow({ 5: '2025-06-01' })]).categories.get('CategoryA')!.items[0];
    expect(item.date).toBeInstanceOf(Date);
    expect(Number.isNaN((item.date as Date).getTime())).toBe(false);
  });

  it('keeps date as string when row[5] is a non-empty, non-parseable string', () => {
    const item = parseSheetRows([makeRow({ 5: 'Spring 2025' })]).categories.get('CategoryA')!.items[0];
    expect(item.date).toBe('Spring 2025');
  });

  it('keeps date as string when row[5] is a non-empty, non-parseable string (e.g. not-a-date)', () => {
    const item = parseSheetRows([makeRow({ 5: 'not-a-date' })]).categories.get('CategoryA')!.items[0];
    expect(item.date).toBe('not-a-date');
  });

  it('leaves date undefined when row[5] is empty string', () => {
    const item = parseSheetRows([makeRow({ 5: '' })]).categories.get('CategoryA')!.items[0];
    expect(item.date).toBeUndefined();
  });

  it('groups two rows with the same category under one key', () => {
    const { categories } = parseSheetRows([makeRow(), makeRow()]);
    expect(categories.size).toBe(1);
    expect(categories.get('CategoryA')!.items).toHaveLength(2);
  });

  it('creates separate entries for different categories', () => {
    const { categories } = parseSheetRows([makeRow({ 6: 'Art' }), makeRow({ 6: 'Experiences' })]);
    expect(categories.size).toBe(2);
    expect(categories.get('Art')!.items).toHaveLength(1);
    expect(categories.get('Experiences')!.items).toHaveLength(1);
  });

  it('preserves insertion order of categories', () => {
    const rows = [
      makeRow({ 6: 'C' }),
      makeRow({ 6: 'A' }),
      makeRow({ 6: 'B' }),
    ];
    expect(Array.from(parseSheetRows(rows).categories.keys())).toEqual(['C', 'A', 'B']);
  });

  // Additional donor emails (columns Q-U, indices 16-20)

  it('leaves additionalDonorEmails undefined when all extra columns are empty', () => {
    const item = parseSheetRows([makeRow()]).categories.get('CategoryA')!.items[0];
    expect(item.additionalDonorEmails).toBeUndefined();
  });

  it('populates additionalDonorEmails from non-empty extra columns, trimmed', () => {
    const item = parseSheetRows([makeRow({ 16: ' co1@example.com ', 17: 'co2@example.com' })]).categories.get('CategoryA')!.items[0];
    expect(item.additionalDonorEmails).toEqual(['co1@example.com', 'co2@example.com']);
  });

  it('filters empty strings out of additional donor emails', () => {
    const item = parseSheetRows([makeRow({ 16: 'co1@example.com', 17: '', 18: 'co2@example.com' })]).categories.get('CategoryA')!.items[0];
    expect(item.additionalDonorEmails).toEqual(['co1@example.com', 'co2@example.com']);
  });

  it('produces no warnings when all additional emails are distinct from the primary', () => {
    const { warnings } = parseSheetRows([makeRow({ 16: 'co1@example.com', 17: 'co2@example.com' })]);
    expect(warnings).toHaveLength(0);
  });

  it('warns when an additional email duplicates the primary donor email (case-insensitive)', () => {
    const { warnings } = parseSheetRows([makeRow({ 16: 'DONOR@EXAMPLE.COM' })]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('ItemName');
    expect(warnings[0]).toContain('DONOR@EXAMPLE.COM');
  });

  it('warns when two additional emails duplicate each other (case-insensitive)', () => {
    const { warnings } = parseSheetRows([makeRow({ 16: 'co1@example.com', 17: 'CO1@EXAMPLE.COM' })]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('ItemName');
    expect(warnings[0]).toContain('CO1@EXAMPLE.COM');
  });

  it('produces one warning per duplicate, not one per item', () => {
    // Two dupes in one row: index 17 duplicates index 16, index 18 duplicates primary
    const { warnings } = parseSheetRows([makeRow({ 16: 'co1@example.com', 17: 'co1@example.com', 18: 'donor@example.com' })]);
    expect(warnings).toHaveLength(2);
  });
});
