import { describe, it, expect } from 'vitest'
import { parseSheetRows } from './parseSheetData'

function makeRow(overrides: Partial<Record<number, string>> = {}): string[] {
  const row = [
    'ItemName', '', '42', '', 'A description', 'Details', '2025-06-01', 'CategoryA',
    'Donor Co', 'donor@example.com', 'Donor Co', '3', 'qty notes', '100', '50', '10', 'auction',
  ];
  Object.entries(overrides).forEach(([i, v]) => { row[Number(i)] = v; });
  return row;
}

describe('parseSheetRows', () => {
  it('returns empty Map for undefined input', () => {
    expect(parseSheetRows(undefined).size).toBe(0);
  });

  it('returns empty Map for empty array', () => {
    expect(parseSheetRows([]).size).toBe(0);
  });

  it('maps a single row to its category', () => {
    const result = parseSheetRows([makeRow()]);
    expect(result.size).toBe(1);
    expect(result.has('CategoryA')).toBe(true);
    expect(result.get('CategoryA')!.items).toHaveLength(1);
  });

  it('maps all required fields to the correct columns', () => {
    const row = makeRow();
    const item = parseSheetRows([row]).get('CategoryA')!.items[0];
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

  it('parses value as number when row[13] is an integer string', () => {
    const item = parseSheetRows([makeRow({ 13: '250' })]).get('CategoryA')!.items[0];
    expect(item.value).toBe(250);
  });

  it('leaves value undefined when row[13] is not an integer', () => {
    const item = parseSheetRows([makeRow({ 13: 'N/A' })]).get('CategoryA')!.items[0];
    expect(item.value).toBeUndefined();
  });

  it('leaves value undefined when row[13] is empty string', () => {
    const item = parseSheetRows([makeRow({ 13: '' })]).get('CategoryA')!.items[0];
    expect(item.value).toBeUndefined();
  });

  it('parses date when row[6] is a valid date string', () => {
    const item = parseSheetRows([makeRow({ 6: '2025-06-01' })]).get('CategoryA')!.items[0];
    expect(item.date).toBeInstanceOf(Date);
    expect(isNaN(item.date!.getTime())).toBe(false);
  });

  it('leaves date undefined when row[6] is not a valid date', () => {
    const item = parseSheetRows([makeRow({ 6: 'not-a-date' })]).get('CategoryA')!.items[0];
    expect(item.date).toBeUndefined();
  });

  it('leaves date undefined when row[6] is empty string', () => {
    const item = parseSheetRows([makeRow({ 6: '' })]).get('CategoryA')!.items[0];
    expect(item.date).toBeUndefined();
  });

  it('groups two rows with the same category under one key', () => {
    const result = parseSheetRows([makeRow(), makeRow()]);
    expect(result.size).toBe(1);
    expect(result.get('CategoryA')!.items).toHaveLength(2);
  });

  it('creates separate entries for different categories', () => {
    const result = parseSheetRows([makeRow({ 7: 'Art' }), makeRow({ 7: 'Experiences' })]);
    expect(result.size).toBe(2);
    expect(result.get('Art')!.items).toHaveLength(1);
    expect(result.get('Experiences')!.items).toHaveLength(1);
  });

  it('preserves insertion order of categories', () => {
    const rows = [
      makeRow({ 7: 'C' }),
      makeRow({ 7: 'A' }),
      makeRow({ 7: 'B' }),
    ];
    expect(Array.from(parseSheetRows(rows).keys())).toEqual(['C', 'A', 'B']);
  });
});
