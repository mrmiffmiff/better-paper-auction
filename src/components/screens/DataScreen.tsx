import type { ItemCategory } from "@/lib/basicItemData";
import { Button } from "../ui/button";

interface DataScreenProps {
    readonly cats: Map<string, ItemCategory>,
    readonly onLogout: () => void;
}

export function DataScreen({ cats, onLogout }: DataScreenProps) {
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
            <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
    )
}