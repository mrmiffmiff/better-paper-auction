import type { ExpandedItemData, Bid } from './basicItemData';
import { loadGmailApi } from './gapiClient';

export interface DraftOptions {
    ccEmails: string;
    bccEmails: string;
    orgName: string;
    auctionName: string;
    subjectPrefix?: string;
}

interface DraftResult {
    success: number;
    skipped: number;
    errors: string[];
    drafts: Array<{ id: string; name: string }>;
}

function escapeHtml(s: string): string {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildBidderTable(bids: Bid[]): string {
    const cellStyle = 'border:1px solid black;padding:4px';
    const headers = ['Winner Name', 'Email', 'Quantity']
        .map(h => `<th style="${cellStyle};text-align:center;font-weight:bold">${h}</th>`)
        .join('');
    const rows = bids.map(bid => {
        const winnerName = bid.bidder.spouseName
            ? `${bid.bidder.name} and ${bid.bidder.spouseName}`
            : bid.bidder.name;
        const contactEmail = bid.bidder.spouseEmail
            ? `${bid.bidder.email}, ${bid.bidder.spouseEmail}`
            : bid.bidder.email;
        return `<tr><td style="${cellStyle}">${escapeHtml(winnerName)}</td><td style="${cellStyle}">${escapeHtml(contactEmail)}</td><td style="${cellStyle}">${bid.quantity}</td></tr>`;
    }).join('');
    return `<table style="border-collapse:collapse"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function encodeHeaderValue(value: string): string {
    if (!/[-￿]/.test(value)) return value;
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(b => binary += String.fromCodePoint(b));
    return `=?UTF-8?B?${btoa(binary)}?=`;
}

function toBase64Url(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCodePoint(b));
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function buildMime(item: ExpandedItemData, options: DraftOptions): string {
    const { ccEmails, bccEmails, auctionName } = options;

    const dateClause = item.date instanceof Date ? ` on ${escapeHtml(formatDate(item.date))}` : '';
    const sum = item.successfulBids.reduce((acc, b) => acc + b.totalAmount, 0);
    const formattedSum = sum.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const body = [
        `<p>Dear ${escapeHtml(item.donorDisplay)},</p>`,
        `<p>Thank you so much for your generous donation of &ldquo;${escapeHtml(item.name)}&rdquo;${dateClause} to the ${escapeHtml(auctionName)}. We&rsquo;re pleased to share the results with you.</p>`,
        `<p>Below are the winning bidder(s) for your item. Please be in touch with them to work out logistics.</p>`,
        buildBidderTable(item.successfulBids),
        `<p>Your item raised ${escapeHtml(formattedSum)}!</p>`,
        `<p>Your support makes a meaningful difference in our community. We truly appreciate your generosity.</p>`,
        `<p>With gratitude,<br>The Auction Committee</p>`,
    ].join('\n');

    const toAddresses = [item.donorEmail, ...(item.additionalDonorEmails ?? [])].join(', ');

    const headers = [
        `To: ${toAddresses}`,
        ...(ccEmails.trim() ? [`Cc: ${ccEmails.trim()}`] : []),
        ...(bccEmails.trim() ? [`Bcc: ${bccEmails.trim()}`] : []),
        `Subject: ${encodeHeaderValue((options.subjectPrefix ?? '') + 'Donor Report for ' + item.name)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
    ].join('\n');

    return `${headers}\n\n${body}`;
}

async function attemptDraft(raw: string): Promise<string> {
    const resp = await gapi.client.gmail.users.drafts.create({
        userId: 'me',
        resource: { message: { raw } },
    });
    return resp.result.id!;
}

export async function createDonorReportDrafts(
    expandedItems: Map<number, ExpandedItemData>,
    options: DraftOptions,
): Promise<DraftResult> {
    await loadGmailApi();

    interface QueueItem { item: ExpandedItemData; raw: string }

    let success = 0;
    let skipped = 0;
    const errors: string[] = [];
    const drafts: Array<{ id: string; name: string }> = [];

    const queue: QueueItem[] = [];
    for (const item of expandedItems.values()) {
        if (!item.donorEmail) {
            skipped++;
            continue;
        }
        queue.push({ item, raw: toBase64Url(buildMime(item, options)) });
    }

    // Pass 1
    const retry1: QueueItem[] = [];
    for (const entry of queue) {
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.item.name });
        } catch {
            retry1.push(entry);
        }
    }

    // Pass 2
    const retry2: QueueItem[] = [];
    for (const entry of retry1) {
        console.warn(`Retrying draft for "${entry.item.name}" (attempt 2)`);
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.item.name });
        } catch {
            retry2.push(entry);
        }
    }

    // Pass 3
    for (const entry of retry2) {
        console.warn(`Retrying draft for "${entry.item.name}" (attempt 3)`);
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.item.name });
        } catch (err) {
            console.error(`Failed to create draft for "${entry.item.name}" after 3 attempts:`, err);
            errors.push(entry.item.name);
        }
    }

    return { success, skipped, errors, drafts };
}

export async function createDonorReminderDrafts(
    expandedItems: Map<number, ExpandedItemData>,
    options: DraftOptions,
): Promise<DraftResult> {
    const datedItems = new Map(
        [...expandedItems].filter(([, item]) => item.date instanceof Date)
    );
    return createDonorReportDrafts(datedItems, { ...options, subjectPrefix: 'REMINDER: ' });
}
