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
    readonly onLoad: (sheetId: string, worksheetName: string, lastRow: number, categoryTabName: string, categoryNameCol: string, categoryIdCol: string) => Promise<void>,
}

export function SpreadsheetViewScreen({ spreadsheetId, spreadsheetName, onReturn, onLoad }: SpreadsheetViewScreenProps) {
    const [worksheetName, setWorksheetName] = useState<string>("Events");
    const [lastRow, setLastRow] = useState<number>(2);
    const [categoryTabName, setCategoryTabName] = useState<string>("Utils");
    const [categoryNameCol, setCategoryNameCol] = useState<string>("A");
    const [categoryIdCol, setCategoryIdCol] = useState<string>("B");

    function loadData() {
        onLoad(spreadsheetId, worksheetName, lastRow, categoryTabName, categoryNameCol, categoryIdCol);
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
            <Field>
                <FieldLabel htmlFor="input-field-category-tab-name">Category Tab Name</FieldLabel>
                <Input
                    id="input-field-category-tab-name"
                    type="text"
                    placeholder="Category Tab Name (leave blank to skip)"
                    value={categoryTabName}
                    onChange={(e) => setCategoryTabName(e.target.value)}
                />
                <FieldDescription>
                    Name of the worksheet tab containing category IDs. Leave blank to skip category lookup.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="input-field-category-name-col">Category Name Column</FieldLabel>
                <Input
                    id="input-field-category-name-col"
                    type="text"
                    placeholder="Column letter (e.g. A)"
                    value={categoryNameCol}
                    onChange={(e) => setCategoryNameCol(e.target.value)}
                />
                <FieldDescription>
                    Column letter in the category tab that contains the category name.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="input-field-category-id-col">Category ID Column</FieldLabel>
                <Input
                    id="input-field-category-id-col"
                    type="text"
                    placeholder="Column letter (e.g. B)"
                    value={categoryIdCol}
                    onChange={(e) => setCategoryIdCol(e.target.value)}
                />
                <FieldDescription>
                    Column letter in the category tab that contains the category ID number.
                </FieldDescription>
            </Field>
            <Button onClick={loadData}>Load Data</Button>
            <Button onClick={onReturn}>Return</Button>
        </div>
    );
}