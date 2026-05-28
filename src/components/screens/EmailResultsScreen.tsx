import { useState } from "react";
import type { BidderData, ExpandedItemData } from "@/lib/basicItemData";
import { createDonorReportDrafts, createDonorReminderDrafts } from "@/lib/createDonorReportDrafts";
import { createBidderReportDrafts } from "@/lib/createBidderReportDrafts";
import { sendDrafts } from "@/lib/sendDrafts";
import type { SendResult } from "@/lib/sendDrafts";
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
    readonly bidders: Map<string, BidderData>;
    readonly onBack: () => void;
}

type Phase = 'idle' | 'drafting' | 'sending';

interface DraftOnlyResult {
    kind: 'draft-only';
    success: number;
    skipped: number;
    errors: string[];
}

interface DraftAndSendResult {
    kind: 'draft-and-send';
    draftSuccess: number;
    draftSkipped: number;
    draftErrors: string[];
    sendResult: SendResult | null;
}

type ReportResult = DraftOnlyResult | DraftAndSendResult;

function winnersForItem(item: ExpandedItemData): string[] {
    return item.successfulBids.map(bid => bid.bidder.name);
}

function renderSendText(sendResult: SendResult | null): string {
    if (sendResult === null) return ' Sending…';
    const failureText = sendResult.errors.length > 0
        ? ` Failed to send: ${sendResult.errors.join(', ')}.`
        : '';
    return ` Sent ${sendResult.sent}.${failureText}`;
}

export function EmailResultsScreen({ expandedItems, bidders, onBack }: EmailResultsScreenProps) {
    const sortedItems = [...expandedItems.values()].sort((a, b) => a.itemNumber - b.itemNumber);

    const [ccEmails, setCcEmails] = useState('');
    const [bccEmails, setBccEmails] = useState('');
    const [orgName, setOrgName] = useState('');
    const [auctionName, setAuctionName] = useState('Gala Auction');
    const [accountingSystemName, setAccountingSystemName] = useState('');

    const [donorPhase, setDonorPhase] = useState<Phase>('idle');
    const [donorResult, setDonorResult] = useState<ReportResult | null>(null);
    const [reminderDonorPhase, setReminderDonorPhase] = useState<Phase>('idle');
    const [reminderDonorResult, setReminderDonorResult] = useState<DraftOnlyResult | null>(null);
    const [bidderPhase, setBidderPhase] = useState<Phase>('idle');
    const [bidderResult, setBidderResult] = useState<ReportResult | null>(null);

    const isAnyBusy = donorPhase !== 'idle' || reminderDonorPhase !== 'idle' || bidderPhase !== 'idle';

    async function handleCreateDonorDrafts() {
        setDonorPhase('drafting');
        setDonorResult(null);
        try {
            const result = await createDonorReportDrafts(expandedItems, { ccEmails, bccEmails, orgName, auctionName });
            setDonorResult({ kind: 'draft-only', success: result.success, skipped: result.skipped, errors: result.errors });
        } finally {
            setDonorPhase('idle');
        }
    }

    async function handleCreateAndSendDonorDrafts() {
        setDonorPhase('drafting');
        setDonorResult(null);
        let draftResult;
        try {
            draftResult = await createDonorReportDrafts(expandedItems, { ccEmails, bccEmails, orgName, auctionName });
        } catch {
            setDonorPhase('idle');
            return;
        }
        setDonorResult({
            kind: 'draft-and-send',
            draftSuccess: draftResult.success,
            draftSkipped: draftResult.skipped,
            draftErrors: draftResult.errors,
            sendResult: null,
        });
        setDonorPhase('sending');
        try {
            const sendResult = await sendDrafts(draftResult.drafts);
            setDonorResult(prev => prev?.kind === 'draft-and-send' ? { ...prev, sendResult } : prev);
        } finally {
            setDonorPhase('idle');
        }
    }

    async function handleCreateDonorReminderDrafts() {
        setReminderDonorPhase('drafting');
        setReminderDonorResult(null);
        try {
            const result = await createDonorReminderDrafts(expandedItems, { ccEmails, bccEmails, orgName, auctionName });
            setReminderDonorResult({ kind: 'draft-only', success: result.success, skipped: result.skipped, errors: result.errors });
        } finally {
            setReminderDonorPhase('idle');
        }
    }

    async function handleCreateBidderDrafts() {
        setBidderPhase('drafting');
        setBidderResult(null);
        try {
            const result = await createBidderReportDrafts(bidders, { ccEmails, bccEmails, orgName, auctionName, accountingSystemName });
            setBidderResult({ kind: 'draft-only', success: result.success, skipped: result.skipped, errors: result.errors });
        } finally {
            setBidderPhase('idle');
        }
    }

    async function handleCreateAndSendBidderDrafts() {
        setBidderPhase('drafting');
        setBidderResult(null);
        let draftResult;
        try {
            draftResult = await createBidderReportDrafts(bidders, { ccEmails, bccEmails, orgName, auctionName, accountingSystemName });
        } catch {
            setBidderPhase('idle');
            return;
        }
        setBidderResult({
            kind: 'draft-and-send',
            draftSuccess: draftResult.success,
            draftSkipped: draftResult.skipped,
            draftErrors: draftResult.errors,
            sendResult: null,
        });
        setBidderPhase('sending');
        try {
            const sendResult = await sendDrafts(draftResult.drafts);
            setBidderResult(prev => prev?.kind === 'draft-and-send' ? { ...prev, sendResult } : prev);
        } finally {
            setBidderPhase('idle');
        }
    }

    function donorPhaseLabel(defaultLabel: string) {
        if (donorPhase === 'drafting') return 'Creating Drafts…';
        if (donorPhase === 'sending') return 'Sending…';
        return defaultLabel;
    }

    function bidderPhaseLabel(defaultLabel: string) {
        if (bidderPhase === 'drafting') return 'Creating Drafts…';
        if (bidderPhase === 'sending') return 'Sending…';
        return defaultLabel;
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
                    <Label htmlFor="bcc-emails">BCC Emails (comma-separated)</Label>
                    <Input
                        id="bcc-emails"
                        value={bccEmails}
                        onChange={e => setBccEmails(e.target.value)}
                        placeholder="bcc1@example.com, bcc2@example.com"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="org-name">Org Name</Label>
                    <Input
                        id="org-name"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
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
                    <Label htmlFor="accounting-system-name">Accounting System Name (bidder reports)</Label>
                    <Input
                        id="accounting-system-name"
                        value={accountingSystemName}
                        onChange={e => setAccountingSystemName(e.target.value)}
                        placeholder="e.g. ShulCloud"
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack}>Back to Data</Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateDonorDrafts} disabled={isAnyBusy}>
                        {donorPhaseLabel('Create Draft Donor Reports')}
                    </Button>
                    <Button onClick={handleCreateAndSendDonorDrafts} disabled={isAnyBusy}>
                        {donorPhaseLabel('Create & Send Donor Reports')}
                    </Button>
                    <Button onClick={handleCreateDonorReminderDrafts} disabled={isAnyBusy}>
                        {reminderDonorPhase === 'drafting' ? 'Creating Drafts…' : 'Create Draft Donor Reminders'}
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateBidderDrafts} disabled={isAnyBusy}>
                        {bidderPhaseLabel('Create Draft Bidder Reports')}
                    </Button>
                    <Button onClick={handleCreateAndSendBidderDrafts} disabled={isAnyBusy}>
                        {bidderPhaseLabel('Create & Send Bidder Reports')}
                    </Button>
                </div>
            </div>
            {donorResult?.kind === 'draft-only' && (
                <p className="text-sm">
                    Donor reports: created {donorResult.success} draft{donorResult.success !== 1 ? 's' : ''}, skipped {donorResult.skipped} (no donor email).
                    {donorResult.errors.length > 0 && ` Failed: ${donorResult.errors.join(', ')}.`}
                </p>
            )}
            {donorResult?.kind === 'draft-and-send' && (
                <p className="text-sm">
                    Donor reports: created {donorResult.draftSuccess} draft{donorResult.draftSuccess !== 1 ? 's' : ''}, skipped {donorResult.draftSkipped} (no donor email).
                    {donorResult.draftErrors.length > 0 && ` Failed to draft: ${donorResult.draftErrors.join(', ')}.`}
                    {renderSendText(donorResult.sendResult)}
                </p>
            )}
            {reminderDonorResult?.kind === 'draft-only' && (
                <p className="text-sm">
                    Donor reminders: created {reminderDonorResult.success} draft{reminderDonorResult.success === 1 ? '' : 's'}, skipped {reminderDonorResult.skipped} (no donor email).
                    {reminderDonorResult.errors.length > 0 && ` Failed: ${reminderDonorResult.errors.join(', ')}.`}
                </p>
            )}
            {bidderResult?.kind === 'draft-only' && (
                <p className="text-sm">
                    Bidder reports: created {bidderResult.success} draft{bidderResult.success !== 1 ? 's' : ''}, skipped {bidderResult.skipped} (no email or no bids).
                    {bidderResult.errors.length > 0 && ` Failed: ${bidderResult.errors.join(', ')}.`}
                </p>
            )}
            {bidderResult?.kind === 'draft-and-send' && (
                <p className="text-sm">
                    Bidder reports: created {bidderResult.draftSuccess} draft{bidderResult.draftSuccess !== 1 ? 's' : ''}, skipped {bidderResult.draftSkipped} (no email or no bids).
                    {bidderResult.draftErrors.length > 0 && ` Failed to draft: ${bidderResult.draftErrors.join(', ')}.`}
                    {renderSendText(bidderResult.sendResult)}
                </p>
            )}
        </div>
    );
}
