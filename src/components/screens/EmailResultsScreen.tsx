import { useState } from "react";
import type { ExpandedItemData } from "@/lib/basicItemData";
import { createDonorReportDrafts } from "@/lib/createDonorReportDrafts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
    readonly onBack: () => void;
}

function winnersForItem(item: ExpandedItemData): string[] {
    return item.successfulBids.map(bid => bid.bidder.name);
}

export function EmailResultsScreen({ expandedItems, onBack }: EmailResultsScreenProps) {
    const sortedItems = [...expandedItems.values()].sort((a, b) => a.itemNumber - b.itemNumber);

    const [ccEmails, setCcEmails] = useState('');
    const [auctionName, setAuctionName] = useState('Gala Auction');
    const [groupName, setGroupName] = useState('Auction Committee');
    const [isDrafting, setIsDrafting] = useState(false);
    const [draftResult, setDraftResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);

    async function handleCreateDrafts() {
        setIsDrafting(true);
        setDraftResult(null);
        try {
            const result = await createDonorReportDrafts(expandedItems, { ccEmails, auctionName, groupName });
            setDraftResult(result);
        } finally {
            setIsDrafting(false);
        }
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
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="cc-emails">CC Emails (comma-separated)</Label>
                    <Input
                        id="cc-emails"
                        value={ccEmails}
                        onChange={e => setCcEmails(e.target.value)}
                        placeholder="cc1@example.com, cc2@example.com"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="auction-name">Auction Name</Label>
                    <Input
                        id="auction-name"
                        value={auctionName}
                        onChange={e => setAuctionName(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="group-name">Sender Name</Label>
                    <Input
                        id="group-name"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onBack}>Back to Data</Button>
                <Button onClick={handleCreateDrafts} disabled={isDrafting}>
                    {isDrafting ? 'Creating Drafts…' : 'Create Draft Donor Reports'}
                </Button>
            </div>
            {draftResult && (
                <p className="text-sm">
                    Created {draftResult.success} draft{draftResult.success !== 1 ? 's' : ''}, skipped {draftResult.skipped} (no donor email).
                    {draftResult.errors.length > 0 && ` Failed: ${draftResult.errors.join(', ')}.`}
                </p>
            )}
        </div>
    );
}
