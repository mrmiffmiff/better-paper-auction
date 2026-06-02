import { useState } from "react";
import type { ItemCategory } from "@/lib/basicItemData";
import { Button } from "../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

interface DataScreenProps {
    readonly cats: Map<string, ItemCategory>,
    readonly warnings?: string[],
    readonly onLogout: () => void;
    readonly onCreateCatalog: () => Promise<void>;
    readonly onCreateBidSheets: () => Promise<void>;
    readonly onCreateExpandedSheet: () => Promise<void>;
    readonly onLoadEmailData: () => void;
    readonly onReloadData: () => void;
}

export function DataScreen({ cats, warnings = [], onLogout, onCreateCatalog, onCreateBidSheets, onCreateExpandedSheet, onLoadEmailData, onReloadData }: DataScreenProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [isCreatingBidSheets, setIsCreatingBidSheets] = useState(false);
    const [bidSheetsError, setBidSheetsError] = useState<string | null>(null);
    const [isCreatingExpandedSheet, setIsCreatingExpandedSheet] = useState(false);
    const [expandedSheetError, setExpandedSheetError] = useState<string | null>(null);

    const isAnyCreating = isCreating || isCreatingBidSheets || isCreatingExpandedSheet;

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
        <div className="flex flex-col flex-1">
            {/* Scrollable content — bottom padding reserves room for the sticky bar */}
            <div className="flex flex-col gap-6 px-4 sm:px-6 pt-6 pb-44">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {totalItems} item{totalItems === 1 ? '' : 's'} across {cats.size} categor{cats.size === 1 ? 'y' : 'ies'}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onReloadData}>Reload Data</Button>
                        <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
                    </div>
                </div>

                {warnings.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 p-3">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Import warnings</p>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5">
                            {warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                )}

                {Array.from(cats.values()).map((category) => (
                    <div key={category.name} className="flex flex-col gap-2">
                        <h2>{category.name}</h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-2/5">Name</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {category.items.map((item) => (
                                    <TableRow key={item.itemNumber}>
                                        <TableCell className="font-medium align-top">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground whitespace-normal align-top">{item.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ))}
            </div>

            {/* Sticky action bar */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-4 sm:px-6 py-4 z-10 flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Create Documents</p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleCreateCatalog} disabled={isAnyCreating}>
                            {isCreating ? 'Creating Catalog…' : 'Create Catalog'}
                        </Button>
                        <Button onClick={handleCreateBidSheets} disabled={isAnyCreating}>
                            {isCreatingBidSheets ? 'Creating Bid Sheets…' : 'Create Bid Sheets'}
                        </Button>
                        <Button onClick={handleCreateExpandedSheet} disabled={isAnyCreating}>
                            {isCreatingExpandedSheet ? 'Creating Expanded Sheet…' : 'Create Expanded Sheet'}
                        </Button>
                        <Button variant="outline" onClick={onLoadEmailData} disabled={isAnyCreating}>
                            Load Email Data
                        </Button>
                    </div>
                </div>
                {(catalogError || bidSheetsError || expandedSheetError) && (
                    <div className="flex flex-col gap-0.5">
                        {catalogError && <p className="text-xs text-destructive">{catalogError}</p>}
                        {bidSheetsError && <p className="text-xs text-destructive">{bidSheetsError}</p>}
                        {expandedSheetError && <p className="text-xs text-destructive">{expandedSheetError}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
