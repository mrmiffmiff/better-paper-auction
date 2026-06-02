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

function ResultSummary({ result }: { result: ReportResult | DraftOnlyResult | null; label: string }) {
    if (!result) return null;
    if (result.kind === 'draft-only') {
        return (
            <p className="text-xs text-muted-foreground">
                Created {result.success} draft{result.success !== 1 ? 's' : ''}, skipped {result.skipped}.
                {result.errors.length > 0 && <span className="text-destructive"> Failed: {result.errors.join(', ')}.</span>}
            </p>
        );
    }
    return (
        <p className="text-xs text-muted-foreground">
            Created {result.draftSuccess} draft{result.draftSuccess !== 1 ? 's' : ''}, skipped {result.draftSkipped}.
            {result.draftErrors.length > 0 && <span className="text-destructive"> Failed to draft: {result.draftErrors.join(', ')}.</span>}
            {renderSendText(result.sendResult)}
        </p>
    );
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

    const isReadyToSend = orgName.trim() !== '' && auctionName.trim() !== '';

    return (
        <div className="w-full flex flex-col gap-6 px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}</p>
                <Button variant="outline" size="sm" onClick={onBack}>Back to Data</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Item #</TableHead>
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
                                    <TableCell className="text-muted-foreground">—</TableCell>
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

            <div className="border-t pt-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <p className="text-sm font-medium">Email Settings</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="org-name">
                                Org Name <span className="text-destructive" aria-hidden="true">*</span>
                            </Label>
                            <Input
                                id="org-name"
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                                aria-required="true"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="auction-name">
                                Auction Name <span className="text-destructive" aria-hidden="true">*</span>
                            </Label>
                            <Input
                                id="auction-name"
                                value={auctionName}
                                onChange={e => setAuctionName(e.target.value)}
                                aria-required="true"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cc-emails">CC Emails</Label>
                            <Input
                                id="cc-emails"
                                value={ccEmails}
                                onChange={e => setCcEmails(e.target.value)}
                                placeholder="email1@example.com, email2@example.com"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="bcc-emails">BCC Emails</Label>
                            <Input
                                id="bcc-emails"
                                value={bccEmails}
                                onChange={e => setBccEmails(e.target.value)}
                                placeholder="email1@example.com, email2@example.com"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <Label htmlFor="accounting-system-name">Accounting System Name <span className="text-muted-foreground font-normal">(bidder reports)</span></Label>
                            <Input
                                id="accounting-system-name"
                                value={accountingSystemName}
                                onChange={e => setAccountingSystemName(e.target.value)}
                                placeholder="e.g. ShulCloud"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {!isReadyToSend && (
                        <p className="text-xs text-muted-foreground">
                            Fill in Org Name and Auction Name to enable sending.
                        </p>
                    )}

                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Donor Reports</p>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleCreateDonorDrafts} disabled={isAnyBusy || !isReadyToSend}>
                                {donorPhaseLabel('Create Drafts')}
                            </Button>
                            <Button onClick={handleCreateAndSendDonorDrafts} disabled={isAnyBusy || !isReadyToSend}>
                                {donorPhaseLabel('Create & Send')}
                            </Button>
                            <Button variant="outline" onClick={handleCreateDonorReminderDrafts} disabled={isAnyBusy || !isReadyToSend}>
                                {reminderDonorPhase === 'drafting' ? 'Creating…' : 'Create Reminder Drafts'}
                            </Button>
                        </div>
                        <ResultSummary result={donorResult} label="Donor reports" />
                        <ResultSummary result={reminderDonorResult} label="Donor reminders" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Bidder Reports</p>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleCreateBidderDrafts} disabled={isAnyBusy || !isReadyToSend}>
                                {bidderPhaseLabel('Create Drafts')}
                            </Button>
                            <Button onClick={handleCreateAndSendBidderDrafts} disabled={isAnyBusy || !isReadyToSend}>
                                {bidderPhaseLabel('Create & Send')}
                            </Button>
                        </div>
                        <ResultSummary result={bidderResult} label="Bidder reports" />
                    </div>
                </div>
            </div>
        </div>
    );
}
