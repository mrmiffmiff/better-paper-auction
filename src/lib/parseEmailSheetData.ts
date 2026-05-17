import type { ItemCategory, ItemData, ExpandedItemData, BidderData, Bid } from './basicItemData';

const PADDLE_CATEGORY_NAME = 'Paddle';
const PADDLE_CATEGORY_ID = 1000;

export function parseEmailSheetData(
    values: string[][],
    cats: Map<string, ItemCategory>,
): { expandedItems: Map<number, ExpandedItemData>; bidders: Map<string, BidderData> } {
    const itemLookup = new Map<number, ItemData>();
    for (const cat of cats.values()) {
        for (const item of cat.items) {
            itemLookup.set(item.itemNumber, item);
        }
    }

    const expandedItems = new Map<number, ExpandedItemData>();
    const bidders = new Map<string, BidderData>();

    for (const row of values) {
        const itemName = row[0] ?? '';
        const itemNumber = parseInt(row[1]);
        const quantity = parseFloat(row[2]);
        const bidderName = row[3];
        const winningAmount = parseFloat(row[4]);
        const totalAmount = parseFloat(row[5]);
        const bidderEmail = row[7] ?? '';
        const spouseName = row[8] ?? '';
        const spouseEmail = row[9] ?? '';

        if (!itemNumber || !bidderName) continue;

        // Stage 1: Get or create ExpandedItemData
        let expandedItem = expandedItems.get(itemNumber);
        if (!expandedItem) {
            const existing = itemLookup.get(itemNumber);
            if (existing) {
                expandedItem = { ...existing, successfulBids: [] };
            } else {
                expandedItem = {
                    name: itemName,
                    itemNumber,
                    description: '',
                    details: '',
                    donorName: '',
                    donorEmail: '',
                    donorDisplay: '',
                    quantity: 1,
                    quantityNotes: '',
                    minBid: 0,
                    bidIncrement: 0,
                    bidSheetType: '',
                    successfulBids: [],
                };
                if (!cats.has(PADDLE_CATEGORY_NAME)) {
                    cats.set(PADDLE_CATEGORY_NAME, { name: PADDLE_CATEGORY_NAME, id: PADDLE_CATEGORY_ID, items: [] });
                }
                cats.get(PADDLE_CATEGORY_NAME)!.items.push(expandedItem);
            }
            expandedItems.set(itemNumber, expandedItem);
        }

        // Stage 2: Get or create BidderData
        let bidder = bidders.get(bidderName);
        if (!bidder) {
            bidder = {
                name: bidderName,
                email: bidderEmail,
                spouseName: spouseName || undefined,
                spouseEmail: spouseEmail || undefined,
                bids: [],
            };
            bidders.set(bidderName, bidder);
        }

        // Stage 3: Create bid
        const bid: Bid = { quantity, winningAmount, totalAmount };

        // Stage 4: Add bid to both — same object reference for later reverse lookup
        bidder.bids.push(bid);
        expandedItem.successfulBids.push(bid);
    }

    return { expandedItems, bidders };
}
