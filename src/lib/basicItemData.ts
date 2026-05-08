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

export type { ItemData, ItemCategory };