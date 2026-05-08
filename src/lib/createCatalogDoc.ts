import type { ItemData, ItemCategory } from './basicItemData';

function getAllDatedItems(cats: Map<string, ItemCategory>): ItemData[] {
    const all = [...cats.values()].flatMap(c => c.items).filter(item => item.date != null);
    const dated = all
        .filter(item => item.date instanceof Date)
        .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());
    const stringDated = all.filter(item => typeof item.date === 'string').sort((a, b) => a.itemNumber - b.itemNumber);
    return [...dated, ...stringDated];
}

function formatItemDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function extractTableInfo(doc: gapi.client.docs.Document): {
    tableStartIndex: number;
    tableEndIndex: number;
    cellStartIndices: { row: number; col: number; index: number }[];
} {
    const tableEl = doc.body!.content!.find(el => el.table);
    const table = tableEl!.table!;
    const tableStartIndex = tableEl!.startIndex!;
    const tableEndIndex = tableEl!.endIndex!;
    const cellStartIndices = table.tableRows!.flatMap((row, r) =>
        row.tableCells!.map((cell, c) => ({
            row: r, col: c,
            index: cell.content![0].startIndex!,
        }))
    );
    return { tableStartIndex, tableEndIndex, cellStartIndices };
}

function buildCatalogContent(cats: Map<string, ItemCategory>, insertOffset = 1): {
    text: string;
    boldRanges: Array<{ startIndex: number; endIndex: number }>;
    centeredRanges: Array<{ startIndex: number; endIndex: number }>;
    pageBreakPositions: number[];
    categoryHeaderRanges: Array<{ startIndex: number; endIndex: number }>;
    itemHeaderRanges: Array<{ startIndex: number; endIndex: number }>;
} {
    let text = '';
    const boldRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const centeredRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const pageBreakPositions: number[] = [];
    const categoryHeaderRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const itemHeaderRanges: Array<{ startIndex: number; endIndex: number }> = [];

    function addBold(segment: string) {
        const startIndex = text.length + insertOffset;
        text += segment;
        boldRanges.push({ startIndex, endIndex: text.length + insertOffset });
    }

    function addCenteredBold(segment: string) {
        const startIndex = text.length + insertOffset;
        text += segment;
        boldRanges.push({ startIndex, endIndex: text.length + insertOffset });
        centeredRanges.push({ startIndex, endIndex: text.length + insertOffset });
        categoryHeaderRanges.push({ startIndex, endIndex: text.length + insertOffset });
    }

    function addNormal(segment: string) {
        text += segment;
    }

    const categories = [...cats.values()]
        .sort((a, b) => a.id - b.id)
        .map(cat => ({ ...cat, items: [...cat.items].sort((a, b) => a.itemNumber - b.itemNumber) }));
    categories.forEach((category, i) => {
        addCenteredBold(`${category.name}\n`);
        for (const item of category.items) {
            const itemHeaderStart = text.length + insertOffset;
            addBold(`${item.itemNumber}. ${item.name}\n`);
            itemHeaderRanges.push({ startIndex: itemHeaderStart, endIndex: text.length + insertOffset });
            addNormal(`${item.description} `);
            if (item.value) {
                addBold("Value: ");
                if (item.value === "priceless") addNormal("Priceless");
                else addNormal(`$${item.value}`);
            }
            addNormal("\n\n")
            if (item.details) {
                addBold('Details: ');
                addNormal(`${item.details}\n`);
            }
            addBold('Starting Bid: ');
            addNormal(`$${item.minBid}\n`);
            addBold('Thanks To');
            addNormal(`: ${item.donorDisplay}\n\n\n\n`);
        }
        if (i < categories.length - 1) {
            pageBreakPositions.push(text.length + insertOffset);
        }
    });

    return { text, boldRanges, centeredRanges, pageBreakPositions, categoryHeaderRanges, itemHeaderRanges };
}

export async function createCatalogDoc(cats: Map<string, ItemCategory>): Promise<string> {
    const title = `Catalog ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

    const createResp = await gapi.client.docs.documents.create({
        resource: { title },
    });
    const { documentId } = createResp.result;
    if (!documentId) throw new Error('Document creation failed: no documentId returned');

    const datedItems = getAllDatedItems(cats);

    let insertOffset = 1;
    let tablePageBreakRequest: object[] = [];
    let cellFillRequests: object[] = [];
    const tableColumnRequests: object[] = [];

    if (datedItems.length > 0) {
        await gapi.client.docs.documents.batchUpdate({
            documentId,
            resource: {
                requests: [{
                    insertTable: {
                        rows: datedItems.length,
                        columns: 3,
                        location: { index: 1 },
                    },
                }],
            },
        });

        const docResp = await gapi.client.docs.documents.get({ documentId });
        const { tableStartIndex, tableEndIndex, cellStartIndices } = extractTableInfo(docResp.result);
        // Page break goes at tableEndIndex; catalog content follows at tableEndIndex + 1
        tablePageBreakRequest = [{ insertPageBreak: { location: { index: tableEndIndex } } }];
        insertOffset = tableEndIndex + 1;

        // Process cells in reverse document order so earlier indices aren't shifted by later inserts
        cellFillRequests = [...cellStartIndices]
            .sort((a, b) => b.index - a.index)
            .flatMap(({ row, col, index }) => {
                let textValue;
                if (col === 0) {
                    textValue = String(datedItems[row].itemNumber);
                } else if (col === 1) {
                    textValue = datedItems[row].name;
                } else {
                    textValue = formatItemDate(datedItems[row].date!);
                }
                return [{
                    insertText: {
                        location: { index },
                        text: textValue,
                    },
                }];
            });

        tableColumnRequests.push(
            {
                updateTableColumnProperties: {
                    tableStartLocation: { index: tableStartIndex },
                    columnIndices: [0],
                    tableColumnProperties: {
                        widthType: 'FIXED_WIDTH',
                        width: { magnitude: 30, unit: 'PT' },
                    },
                    fields: 'widthType,width',
                },
            },
            {
                updateTableColumnProperties: {
                    tableStartLocation: { index: tableStartIndex },
                    columnIndices: [1],
                    tableColumnProperties: {
                        widthType: 'FIXED_WIDTH',
                        width: { magnitude: 260, unit: 'PT' },
                    },
                    fields: 'widthType,width',
                },
            },
            {
                updateTableColumnProperties: {
                    tableStartLocation: { index: tableStartIndex },
                    columnIndices: [2],
                    tableColumnProperties: {
                        widthType: 'FIXED_WIDTH',
                        width: { magnitude: 168, unit: 'PT' },
                    },
                    fields: 'widthType,width',
                },
            },
        );
    }

    const { text, boldRanges, centeredRanges, pageBreakPositions, categoryHeaderRanges, itemHeaderRanges } = buildCatalogContent(cats, insertOffset);
    if (!text && cellFillRequests.length === 0) return `https://docs.google.com/document/d/${documentId}/edit`;

    const catalogEndIndex = insertOffset + text.length;

    const requests: object[] = [
        ...tablePageBreakRequest,
        ...(text ? [{ insertText: { location: { index: insertOffset }, text } }] : []),
        ...(text ? [{
            updateTextStyle: {
                range: { startIndex: insertOffset, endIndex: catalogEndIndex },
                textStyle: {
                    bold: false,
                    weightedFontFamily: { fontFamily: 'Times New Roman' },
                    fontSize: { magnitude: 12, unit: 'PT' },
                },
                fields: 'bold,weightedFontFamily,fontSize',
            },
        }] : []),
        ...boldRanges.map(({ startIndex, endIndex }) => ({
            updateTextStyle: {
                range: { startIndex, endIndex },
                textStyle: { bold: true },
                fields: 'bold',
            },
        })),
        ...centeredRanges.map(({ startIndex, endIndex }) => ({
            updateParagraphStyle: {
                range: { startIndex, endIndex },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
            },
        })),
        ...categoryHeaderRanges.map(({ startIndex, endIndex }) => ({
            updateTextStyle: {
                range: { startIndex, endIndex },
                textStyle: { fontSize: { magnitude: 16, unit: 'PT' } },
                fields: 'fontSize',
            },
        })),
        ...itemHeaderRanges.map(({ startIndex, endIndex }) => ({
            updateTextStyle: {
                range: { startIndex, endIndex },
                textStyle: { fontSize: { magnitude: 14, unit: 'PT' } },
                fields: 'fontSize',
            },
        })),
        // Page breaks in descending order so prior insertions don't shift later positions
        ...[...pageBreakPositions].reverse().map(index => ({
            insertPageBreak: { location: { index } },
        })),
        ...cellFillRequests,
        ...tableColumnRequests,
    ];

    await gapi.client.docs.documents.batchUpdate({
        documentId,
        resource: { requests },
    });

    return `https://docs.google.com/document/d/${documentId}/edit`;
}
