import { useState } from "react";
import type { ItemCategory } from "@/lib/basicItemData";
import { Button } from "../ui/button";

interface DataScreenProps {
    readonly cats: Map<string, ItemCategory>,
    readonly onLogout: () => void;
    readonly onCreateCatalog: () => Promise<void>;
    readonly onCreateBidSheets: () => Promise<void>;
    readonly onCreateExpandedSheet: () => Promise<void>;
}

export function DataScreen({ cats, onLogout, onCreateCatalog, onCreateBidSheets, onCreateExpandedSheet }: DataScreenProps) {
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

    return (
        <div>
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
            <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
    )
}