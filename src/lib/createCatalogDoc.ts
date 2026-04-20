import type { ItemCategory } from './basicItemData';

function buildCatalogContent(cats: Map<string, ItemCategory>): {
    text: string;
    boldRanges: Array<{ startIndex: number; endIndex: number }>;
} {
    let text = '';
    const boldRanges: Array<{ startIndex: number; endIndex: number }> = [];

    function addBold(segment: string) {
        const startIndex = text.length + 1;
        text += segment;
        boldRanges.push({ startIndex, endIndex: text.length + 1 });
    }

    function addNormal(segment: string) {
        text += segment;
    }

    for (const category of cats.values()) {
        for (const item of category.items) {
            addBold(`${item.itemNumber}. ${item.name}\n`);
            addNormal(`${item.description}\n\n`);
            addBold('Details: ');
            addNormal(`${item.details}\n`);
            addBold('Starting Bid: ');
            addNormal(`${item.minBid}\n`);
            addBold('Thanks To');
            addNormal(`: ${item.donorDisplay}\n\n`);
        }
    }

    return { text, boldRanges };
}

export async function createCatalogDoc(cats: Map<string, ItemCategory>): Promise<string> {
    const title = `Catalog ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

    const createResp = await gapi.client.docs.documents.create({
        resource: { title },
    });
    const { documentId } = createResp.result;
    if (!documentId) throw new Error('Document creation failed: no documentId returned');

    const { text, boldRanges } = buildCatalogContent(cats);
    if (!text) return `https://docs.google.com/document/d/${documentId}/edit`;

    const endIndex = text.length + 1;

    const requests: object[] = [
        { insertText: { location: { index: 1 }, text } },
        {
            updateTextStyle: {
                range: { startIndex: 1, endIndex },
                textStyle: {
                    bold: false,
                    weightedFontFamily: { fontFamily: 'Times New Roman' },
                    fontSize: { magnitude: 12, unit: 'PT' },
                },
                fields: 'bold,weightedFontFamily,fontSize',
            },
        },
        ...boldRanges.map(({ startIndex, endIndex }) => ({
            updateTextStyle: {
                range: { startIndex, endIndex },
                textStyle: { bold: true },
                fields: 'bold',
            },
        })),
    ];

    await gapi.client.docs.documents.batchUpdate({
        documentId,
        resource: { requests },
    });

    return `https://docs.google.com/document/d/${documentId}/edit`;
}
