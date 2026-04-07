import { Button } from "../ui/button";
import {
    Field,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input"
import { useState } from "react";

interface SpreadsheetViewScreenProps {
    readonly spreadsheetId: string,
    readonly spreadsheetName: string,
    readonly onReturn: () => void,
    readonly onLoad: (sheetId: string, worksheetName: string, lastRow: number) => Promise<void>,
}

export function SpreadsheetViewScreen({ spreadsheetId, spreadsheetName, onReturn, onLoad }: SpreadsheetViewScreenProps) {
    const [worksheetName, setWorksheetName] = useState<string>("Events");
    const [lastRow, setLastRow] = useState<number>(2);

    function loadData() {
        onLoad(spreadsheetId, worksheetName, lastRow);
    }

    return (
        <div className="flex flex-col">
            <p>Selected Spreadsheet has Id: {spreadsheetId}</p>
            <p>Selected Spreadsheet has Name: {spreadsheetName}</p>
            <Field>
                <FieldLabel htmlFor="input-field-worksheet-name">Worksheet Name</FieldLabel>
                <Input
                    id="input-field-worksheet-name"
                    type="text"
                    placeholder="Relevant Worksheet Name"
                    value={worksheetName}
                    onChange={(e) => setWorksheetName(e.target.value)}
                />
                <FieldDescription>
                    Input the exact name set for the worksheet that contains all the item and event data.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="input-field-last-row">Last Row</FieldLabel>
                <Input
                    id="input-field-last-row"
                    type="number"
                    min="2"
                    value={lastRow}
                    onChange={(e) => setLastRow(Number.parseInt(e.target.value))}
                />
                <FieldDescription>
                    Input the last relevant row of the data set. This will probably be the number of items plus one, as the first row is the header.
                </FieldDescription>
            </Field>
            <Button onClick={loadData}>Load Data</Button>
            <Button onClick={onReturn}>Return</Button>
        </div>
    );
}