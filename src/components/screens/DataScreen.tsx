import { useState } from "react";
import type { ItemCategory } from "@/lib/basicItemData";
import { Button } from "../ui/button";

interface DataScreenProps {
    readonly cats: Map<string, ItemCategory>,
    readonly warnings?: string[],
    readonly onLogout: () => void;
    readonly onCreateCatalog: () => Promise<void>;
    readonly onCreateBidSheets: () => Promise<void>;
    readonly onCreateExpandedSheet: () => Promise<void>;
    readonly onLoadEmailData: () => void;
}

export function DataScreen({ cats, warnings = [], onLogout, onCreateCatalog, onCreateBidSheets, onCreateExpandedSheet, onLoadEmailData }: DataScreenProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [isCreatingBidSheets, setIsCreatingBidSheets] = useState(false);
    const [bidSheetsError, setBidSheetsError] = useState<string | null>(null);
    const [isCreatingExpandedSheet, setIsCreatingExpandedSheet] = useState(false);
    const [expandedSheetError, setExpandedSheetError] = useState<string | null>(null);

    async function handleCreateCatalog() {
        setIsCreating(true);
        setCatalogError(null);
        try {
            await onCreateCatalog();
        } catch (err) {
            setCatalogError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleCreateBidSheets() {
        setIsCreatingBidSheets(true);
        setBidSheetsError(null);
        try {
            await onCreateBidSheets();
        } catch (err) {
            setBidSheetsError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsCreatingBidSheets(false);
        }
    }

    async function handleCreateExpandedSheet() {
        setIsCreatingExpandedSheet(true);
        setExpandedSheetError(null);
        try {
            await onCreateExpandedSheet();
        } catch (err) {
            setExpandedSheetError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsCreatingExpandedSheet(false);
        }
    }

    const totalItems = Array.from(cats.values()).reduce((sum, cat) => sum + cat.items.length, 0);

    return (
        <div>
            <p>{totalItems} item{totalItems === 1 ? '' : 's'} loaded across {cats.size} categor{cats.size === 1 ? 'y' : 'ies'}</p>
            {warnings.length > 0 && (
                <div>
                    <strong>Import warnings:</strong>
                    <ul>
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}
            {Array.from(cats.values()).map((category) => (
                <div key={category.name}>
                    <h2>{category.name}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {category.items.map((item) => (
                                <tr key={item.itemNumber}>
                                    <td>{item.name}</td>
                                    <td>{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            <Button onClick={handleCreateCatalog} disabled={isCreating}>
                {isCreating ? 'Creating Catalog…' : 'Create Catalog'}
            </Button>
            {catalogError && <p>{catalogError}</p>}
            <Button onClick={handleCreateBidSheets} disabled={isCreatingBidSheets}>
                {isCreatingBidSheets ? 'Creating Bid Sheets…' : 'Create Bid Sheets'}
            </Button>
            {bidSheetsError && <p>{bidSheetsError}</p>}
            <Button onClick={handleCreateExpandedSheet} disabled={isCreatingExpandedSheet}>
                {isCreatingExpandedSheet ? 'Creating Expanded Sheet…' : 'Create Expanded Sheet'}
            </Button>
            {expandedSheetError && <p>{expandedSheetError}</p>}
            <Button onClick={onLoadEmailData}>Load Data for Emails</Button>
            <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
    )
}
