import { useState } from "react";
import type { ItemCategory } from "@/lib/basicItemData";
import { Button } from "../ui/button";

interface DataScreenProps {
    readonly cats: Map<string, ItemCategory>,
    readonly onLogout: () => void;
    readonly onCreateCatalog: () => Promise<void>;
}

export function DataScreen({ cats, onLogout, onCreateCatalog }: DataScreenProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);

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
            <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
    )
}