import type { ItemData, ItemCategory } from './basicItemData';

function getAllDatedItems(cats: Map<string, ItemCategory>): ItemData[] {
    return [...cats.values()]
        .flatMap(c => c.items)
        .filter(item => item.date != null)
        .sort((a, b) => a.date!.getTime() - b.date!.getTime());
}

function formatItemDate(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
} {
    let text = '';
    const boldRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const centeredRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const pageBreakPositions: number[] = [];

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
    }

    function addNormal(segment: string) {
        text += segment;
    }

    const categories = [...cats.values()];
    categories.forEach((category, i) => {
        addCenteredBold(`${category.name}\n`);
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
        if (i < categories.length - 1) {
            pageBreakPositions.push(text.length + insertOffset);
        }
    });

    return { text, boldRanges, centeredRanges, pageBreakPositions };
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
                        columns: 2,
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
            .flatMap(({ row, col, index }) => [{
                insertText: {
                    location: { index },
                    text: col === 0 ? datedItems[row].name : formatItemDate(datedItems[row].date!),
                },
            }]);

        tableColumnRequests.push(
            {
                updateTableColumnProperties: {
                    tableStartLocation: { index: tableStartIndex },
                    columnIndices: [0],
                    tableColumnProperties: {
                        widthType: 'FIXED_WIDTH',
                        width: { magnitude: 280, unit: 'PT' },
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
                        width: { magnitude: 188, unit: 'PT' },
                    },
                    fields: 'widthType,width',
                },
            },
        );
    }

    const { text, boldRanges, centeredRanges, pageBreakPositions } = buildCatalogContent(cats, insertOffset);
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
