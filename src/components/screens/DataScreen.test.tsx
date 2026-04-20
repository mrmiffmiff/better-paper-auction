import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataScreen } from './DataScreen'
import type { ItemData, ItemCategory } from '@/lib/basicItemData'

function makeItem(overrides?: Partial<ItemData>): ItemData {
  return {
    name: 'Default Item',
    itemNumber: 1,
    description: 'Default description',
    details: '',
    donorName: 'Donor',
    donorEmail: 'donor@example.com',
    donorDisplay: 'Donor',
    quantity: 1,
    quantityNotes: '',
    minBid: 10,
    bidIncrement: 5,
    bidSheetType: 'auction',
    ...overrides,
  };
}

function makeCategory(name: string, items: ItemData[] = []): ItemCategory {
  return { name, items };
}

describe('DataScreen', () => {
  it('renders a heading for each category', () => {
    const cats = new Map<string, ItemCategory>([
      ['Art', makeCategory('Art')],
      ['Experiences', makeCategory('Experiences')],
    ]);
    render(<DataScreen cats={cats} onLogout={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Art' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Experiences' })).toBeInTheDocument();
  });

  it('renders item name and description in a table row', () => {
    const item = makeItem({ name: 'Pottery Bowl', description: 'Hand-thrown ceramic' });
    const cats = new Map([['Art', makeCategory('Art', [item])]]);
    render(<DataScreen cats={cats} onLogout={vi.fn()} />);
    expect(screen.getByText('Pottery Bowl')).toBeInTheDocument();
    expect(screen.getByText('Hand-thrown ceramic')).toBeInTheDocument();
  });

  it('renders multiple items within a single category', () => {
    const items = [
      makeItem({ itemNumber: 1, name: 'Item One' }),
      makeItem({ itemNumber: 2, name: 'Item Two' }),
      makeItem({ itemNumber: 3, name: 'Item Three' }),
    ];
    const cats = new Map([['Art', makeCategory('Art', items)]]);
    render(<DataScreen cats={cats} onLogout={vi.fn()} />);
    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
    expect(screen.getByText('Item Three')).toBeInTheDocument();
  });

  it('items appear under the correct category heading', () => {
    const artItem = makeItem({ itemNumber: 1, name: 'Painting', description: 'Oil on canvas' });
    const expItem = makeItem({ itemNumber: 2, name: 'Spa Day', description: 'Full day spa' });
    const cats = new Map<string, ItemCategory>([
      ['Art', makeCategory('Art', [artItem])],
      ['Experiences', makeCategory('Experiences', [expItem])],
    ]);
    render(<DataScreen cats={cats} onLogout={vi.fn()} />);

    const artSection = screen.getByRole('heading', { name: 'Art' }).closest('div')!;
    const expSection = screen.getByRole('heading', { name: 'Experiences' }).closest('div')!;

    expect(within(artSection).getByText('Painting')).toBeInTheDocument();
    expect(within(artSection).queryByText('Spa Day')).not.toBeInTheDocument();
    expect(within(expSection).getByText('Spa Day')).toBeInTheDocument();
    expect(within(expSection).queryByText('Painting')).not.toBeInTheDocument();
  });

  it('renders no category headings when categories map is empty', () => {
    render(<DataScreen cats={new Map()} onLogout={vi.fn()} />);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls onLogout when the Logout button is clicked', async () => {
    const onLogout = vi.fn();
    render(<DataScreen cats={new Map()} onLogout={onLogout} />);
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
