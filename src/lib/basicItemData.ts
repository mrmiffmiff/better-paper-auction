interface ItemData {
    name: string,
    itemNumber: number,
    description: string,
    details: string,
    donorName: string,
    donorEmail: string,
    donorDisplay: string,
    quantity: number,
    quantityNotes: string,
    minBid: number,
    bidIncrement: number,
    bidSheetType: string,
    value?: number | "priceless" | undefined,
    date?: Date | string,
}

interface ItemCategory {
    name: string,
    items: ItemData[],
    id: number,
}

interface BidderData {
    name: string,
    email: string,
    spouseName?: string,
    spouseEmail?: string,
    bids: Bid[],
}

interface Bid {
    quantity: number,
    winningAmount: number,
    totalAmount: number,
    bidder: BidderData,
}

interface ExpandedItemData extends ItemData {
    successfulBids: Bid[],
}

export type { ItemData, ItemCategory, BidderData, Bid, ExpandedItemData };