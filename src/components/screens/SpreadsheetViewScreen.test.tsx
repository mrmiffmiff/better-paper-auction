import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpreadsheetViewScreen } from './SpreadsheetViewScreen'

function renderScreen(overrides?: {
  spreadsheetId?: string;
  spreadsheetName?: string;
  onReturn?: () => void;
  onLoad?: (sheetId: string, worksheetName: string, lastRow: number) => Promise<void>;
}) {
  const mocks = {
    onReturn: vi.fn(),
    onLoad: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <SpreadsheetViewScreen
      spreadsheetId="sheet-id-123"
      spreadsheetName="Test Sheet"
      {...mocks}
      {...overrides}
    />
  );
  return mocks;
}

describe('SpreadsheetViewScreen', () => {
  it('displays the spreadsheet id and name from props', () => {
    renderScreen();
    expect(screen.getByText(/sheet-id-123/)).toBeInTheDocument();
    expect(screen.getByText(/Test Sheet/)).toBeInTheDocument();
  });

  it('worksheet name input defaults to "Events"', () => {
    renderScreen();
    expect(screen.getByLabelText(/Worksheet Name/i)).toHaveValue('Events');
  });

  it('last row input defaults to 2', () => {
    renderScreen();
    expect(screen.getByLabelText(/Last Row/i)).toHaveValue(2);
  });

  it('calls onLoad with correct defaults when Load Data is clicked', async () => {
    const { onLoad } = renderScreen();
    await userEvent.click(screen.getByRole('button', { name: /Load Data/i }));
    expect(onLoad).toHaveBeenCalledWith('sheet-id-123', 'Events', 2);
  });

  it('calls onLoad with updated worksheetName after editing', async () => {
    const { onLoad } = renderScreen();
    const input = screen.getByLabelText(/Worksheet Name/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Donors');
    await userEvent.click(screen.getByRole('button', { name: /Load Data/i }));
    expect(onLoad).toHaveBeenCalledWith('sheet-id-123', 'Donors', 2);
  });

  it('calls onLoad with updated lastRow after editing', async () => {
    const { onLoad } = renderScreen();
    const input = screen.getByLabelText(/Last Row/i);
    await userEvent.clear(input);
    await userEvent.type(input, '50');
    await userEvent.click(screen.getByRole('button', { name: /Load Data/i }));
    expect(onLoad).toHaveBeenCalledWith('sheet-id-123', 'Events', 50);
  });

  it('calls onReturn when Return button is clicked', async () => {
    const { onReturn } = renderScreen();
    await userEvent.click(screen.getByRole('button', { name: /Return/i }));
    expect(onReturn).toHaveBeenCalledOnce();
  });
});
