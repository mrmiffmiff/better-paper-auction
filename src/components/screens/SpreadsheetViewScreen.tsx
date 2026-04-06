import { Button } from "../ui/button";

interface SpreadsheetViewScreenProps {
    readonly spreadsheetId: string,
    readonly spreadsheetName: string,
    readonly onReturn: () => void,
}

export function SpreadsheetViewScreen({ spreadsheetId, spreadsheetName, onReturn }: SpreadsheetViewScreenProps) {
    return (
        <div className="flex flex-col">
            <p>Selected Spreadsheet has Id: {spreadsheetId}</p>
            <p>Selected Spreadsheet has Name: {spreadsheetName}</p>
            <Button onClick={onReturn}>Return</Button>
        </div>
    );
}