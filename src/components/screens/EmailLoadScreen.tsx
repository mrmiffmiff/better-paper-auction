import { useState } from "react";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface EmailLoadScreenProps {
    readonly onLoad: (sheetName: string, lastRow: number) => Promise<void>;
    readonly onBack: () => void;
}

export function EmailLoadScreen({ onLoad, onBack }: EmailLoadScreenProps) {
    const [sheetName, setSheetName] = useState("Expanded Items");
    const [lastRow, setLastRow] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLoad() {
        setIsLoading(true);
        setError(null);
        try {
            await onLoad(sheetName, lastRow);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col">
            <Field>
                <FieldLabel htmlFor="email-sheet-name">Expanded Items Sheet Name</FieldLabel>
                <Input
                    id="email-sheet-name"
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                />
                <FieldDescription>
                    Name of the worksheet tab containing the expanded bid data.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="email-last-row">Last Row</FieldLabel>
                <Input
                    id="email-last-row"
                    type="number"
                    min="2"
                    value={lastRow}
                    onChange={(e) => setLastRow(Number.parseInt(e.target.value))}
                />
                <FieldDescription>
                    Last row in the sheet that contains data (not blank).
                </FieldDescription>
            </Field>
            {error && <p>{error}</p>}
            <Button onClick={handleLoad} disabled={isLoading}>
                {isLoading ? 'Loading…' : 'Load Data'}
            </Button>
            <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
    );
}
