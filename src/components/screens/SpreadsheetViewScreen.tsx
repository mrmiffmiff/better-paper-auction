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
        <div className="flex flex-col gap-6 w-full max-w-lg">
            <div>
                <p className="text-sm font-medium text-foreground">{spreadsheetName}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{spreadsheetId}</p>
            </div>

            <div className="flex flex-col gap-4">
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
                        The exact name of the worksheet containing all item and event data.
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
                        Last row with data (number of items + 1, since row 1 is the header).
                    </FieldDescription>
                </Field>

                <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Category Lookup</p>
                    <div className="flex flex-col gap-4">
                        <Field>
                            <FieldLabel htmlFor="input-field-category-tab-name">Category Tab Name</FieldLabel>
                            <Input
                                id="input-field-category-tab-name"
                                type="text"
                                placeholder="Leave blank to skip"
                                value={categoryTabName}
                                onChange={(e) => setCategoryTabName(e.target.value)}
                            />
                            <FieldDescription>
                                Worksheet tab containing category IDs. Leave blank to skip.
                            </FieldDescription>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field>
                                <FieldLabel htmlFor="input-field-category-name-col">Name Column</FieldLabel>
                                <Input
                                    id="input-field-category-name-col"
                                    type="text"
                                    placeholder="e.g. A"
                                    value={categoryNameCol}
                                    onChange={(e) => setCategoryNameCol(e.target.value)}
                                />
                                <FieldDescription>Column with category name.</FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="input-field-category-id-col">ID Column</FieldLabel>
                                <Input
                                    id="input-field-category-id-col"
                                    type="text"
                                    placeholder="e.g. B"
                                    value={categoryIdCol}
                                    onChange={(e) => setCategoryIdCol(e.target.value)}
                                />
                                <FieldDescription>Column with category ID.</FieldDescription>
                            </Field>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onReturn}>Back</Button>
                <Button onClick={loadData}>Load Data</Button>
            </div>
        </div>
    );
}
