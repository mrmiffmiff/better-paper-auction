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
    value?: number,
    date?: Date,
}

interface ItemCategory {
    name: string,
    items: ItemData[],
}

export type { ItemData, ItemCategory };