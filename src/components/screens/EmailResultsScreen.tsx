import type { ExpandedItemData, BidderData } from "@/lib/basicItemData";
import { Button } from "../ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

interface EmailResultsScreenProps {
    readonly expandedItems: Map<number, ExpandedItemData>;
    readonly bidders: Map<string, BidderData>;
    readonly onBack: () => void;
}

export function EmailResultsScreen({ expandedItems, bidders, onBack }: EmailResultsScreenProps) {
    const sortedItems = [...expandedItems.values()].sort((a, b) => a.itemNumber - b.itemNumber);

    function winnersForItem(item: ExpandedItemData): string[] {
        return item.successfulBids.map(bid => {
            const bidder = [...bidders.values()].find(b => b.bids.includes(bid));
            return bidder?.name ?? '(unknown)';
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Winner</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedItems.flatMap(item => {
                        const winners = winnersForItem(item);
                        if (winners.length === 0) {
                            return [
                                <TableRow key={item.itemNumber}>
                                    <TableCell>{item.itemNumber}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.donorDisplay || item.donorName}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ];
                        }
                        return winners.map((winner, i) => (
                            <TableRow key={`${item.itemNumber}-${i}`}>
                                <TableCell>{i === 0 ? item.itemNumber : ''}</TableCell>
                                <TableCell>{i === 0 ? item.name : ''}</TableCell>
                                <TableCell>{i === 0 ? (item.donorDisplay || item.donorName) : ''}</TableCell>
                                <TableCell>{winner}</TableCell>
                            </TableRow>
                        ));
                    })}
                </TableBody>
            </Table>
            <Button variant="outline" onClick={onBack}>Back to Data</Button>
        </div>
    );
}
