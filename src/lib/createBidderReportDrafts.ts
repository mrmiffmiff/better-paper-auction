import type { BidderData } from './basicItemData';
import { loadGmailApi } from './gapiClient';

interface DraftOptions {
    ccEmails: string;
    bccEmails: string;
    orgName: string;
    auctionName: string;
    accountingSystemName: string;
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

function formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function buildBidTable(bidder: BidderData): string {
    const cellStyle = 'border:1px solid black;padding:4px';
    const headerStyle = `${cellStyle};text-align:center;font-weight:bold`;

    const headers = ['Item', 'Quantity', 'Price', 'Event Date', 'Host Contact']
        .map(h => `<th style="${headerStyle}">${h}</th>`)
        .join('');

    const rows = bidder.bids.map(bid => {
        const item = bid.item;
        const dateStr = item.date instanceof Date ? escapeHtml(formatDate(item.date)) : '';
        const additionalEmails = item.additionalDonorEmails ?? [];
        const hostContact = [
            `${escapeHtml(item.donorDisplay)}<br>${escapeHtml(item.donorEmail)}`,
            ...additionalEmails.map(e => escapeHtml(e)),
        ].join('<br>');
        return [
            `<td style="${cellStyle}">${escapeHtml(item.name)}</td>`,
            `<td style="${cellStyle}">${bid.quantity}</td>`,
            `<td style="${cellStyle}">${escapeHtml(formatCurrency(bid.totalAmount))}</td>`,
            `<td style="${cellStyle}">${dateStr}</td>`,
            `<td style="${cellStyle}">${hostContact}</td>`,
        ].join('');
    }).map(row => `<tr>${row}</tr>`).join('');

    const total = bidder.bids.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalsRow = [
        `<td colspan="2" style="${cellStyle};text-align:right;font-weight:bold">Total Due:</td>`,
        `<td style="${cellStyle};font-weight:bold">${escapeHtml(formatCurrency(total))}</td>`,
        `<td colspan="2" style="${cellStyle}"></td>`,
    ].join('');

    return `<table style="border-collapse:collapse"><thead><tr>${headers}</tr></thead><tbody>${rows}<tr>${totalsRow}</tr></tbody></table>`;
}

function encodeHeaderValue(value: string): string {
    if (!/[-￿]/.test(value)) return value;
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

function buildMime(bidder: BidderData, options: DraftOptions): string {
    const { ccEmails, bccEmails, orgName, auctionName, accountingSystemName } = options;

    const spouseName = bidder.spouseName?.trim() ?? '';
    const spouseEmail = bidder.spouseEmail?.trim() ?? '';

    const salutation = spouseName
        ? `Dear ${escapeHtml(bidder.name)} and ${escapeHtml(spouseName)},`
        : `Dear ${escapeHtml(bidder.name)},`;

    const toAddresses = [bidder.email, ...(spouseEmail ? [spouseEmail] : [])].join(', ');

    const body = [
        `<p>${salutation}</p>`,
        `<p>Thank you so much for your participation in the ${escapeHtml(auctionName)}! Below are the details of your winning bids:</p>`,
        buildBidTable(bidder),
        `<p>If you have any questions about your purchases, please don&rsquo;t hesitate to reply to this email.</p>`,
        `<p>The Total Due will be posted to your${accountingSystemName.trim() ? ` ${escapeHtml(accountingSystemName.trim())}` : ''} account in a few days. This report is just informational and is not a request for payment.</p>`,
        `<p>You can expect to hear from hosts in advance of events with specific logistics, but in the meantime, it would be great if you could block off the dates of the events in your calendar.</p>`,
        `<p>With appreciation,<br>The Auction Committee</p>`,
    ].join('\n');

    const headers = [
        `To: ${toAddresses}`,
        ...(ccEmails.trim() ? [`Cc: ${ccEmails.trim()}`] : []),
        ...(bccEmails.trim() ? [`Bcc: ${bccEmails.trim()}`] : []),
        `Subject: ${encodeHeaderValue(orgName + ' ' + auctionName + ': Your Winning Bids')}`,
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

export async function createBidderReportDrafts(
    bidders: Map<string, BidderData>,
    options: DraftOptions,
): Promise<DraftResult> {
    await loadGmailApi();

    interface QueueItem { bidder: BidderData; raw: string }

    let success = 0;
    let skipped = 0;
    const errors: string[] = [];
    const drafts: Array<{ id: string; name: string }> = [];

    const queue: QueueItem[] = [];
    for (const bidder of bidders.values()) {
        if (!bidder.email || bidder.bids.length === 0) {
            skipped++;
            continue;
        }
        queue.push({ bidder, raw: toBase64Url(buildMime(bidder, options)) });
    }

    // Pass 1
    const retry1: QueueItem[] = [];
    for (const entry of queue) {
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.bidder.name });
        } catch {
            retry1.push(entry);
        }
    }

    // Pass 2
    const retry2: QueueItem[] = [];
    for (const entry of retry1) {
        console.warn(`Retrying draft for bidder "${entry.bidder.name}" (attempt 2)`);
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.bidder.name });
        } catch {
            retry2.push(entry);
        }
    }

    // Pass 3
    for (const entry of retry2) {
        console.warn(`Retrying draft for bidder "${entry.bidder.name}" (attempt 3)`);
        try {
            const id = await attemptDraft(entry.raw);
            success++;
            drafts.push({ id, name: entry.bidder.name });
        } catch (err) {
            console.error(`Failed to create draft for bidder "${entry.bidder.name}" after 3 attempts:`, err);
            errors.push(entry.bidder.name);
        }
    }

    return { success, skipped, errors, drafts };
}
