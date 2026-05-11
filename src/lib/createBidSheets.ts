import type { ItemData, ItemCategory } from './basicItemData';

const BID_TABLE_ROWS = 21; // 1 header row + 20 bid rows
const BID_TABLE_COLS = 2;

function formatBidAmount(amount: number): string {
    return `$${amount}`;
}

function typeACellContentLength(item: ItemData): number {
    let len = 'Bid'.length + 'Bidder'.length;
    for (let k = 0; k < 20; k++) {
        len += formatBidAmount(item.minBid + k * item.bidIncrement).length;
    }
    return len;
}

function buildBidSheetContent(cats: Map<string, ItemCategory>, insertOffset: number): {
    text: string;
    boldRanges: Array<{ startIndex: number; endIndex: number }>;
    headingRanges: Array<{ startIndex: number; endIndex: number }>;
    centeredRanges: Array<{ startIndex: number; endIndex: number }>;
    tableInsertionPoints: Array<{ position: number; item: ItemData; isLast: boolean }>;
} {
    let text = '';
    const boldRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const headingRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const centeredRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const tableInsertionPoints: Array<{ position: number; item: ItemData; isLast: boolean }> = [];

    function addCentered(segment: string) {
        const startIndex = text.length + insertOffset;
        text += segment;
        centeredRanges.push({ startIndex, endIndex: text.length + insertOffset });
    }

    function addBoldCentered(segment: string) {
        const startIndex = text.length + insertOffset;
        text += segment;
        const endIndex = text.length + insertOffset;
        boldRanges.push({ startIndex, endIndex });
        centeredRanges.push({ startIndex, endIndex });
    }

    function addHeadingBoldCentered(segment: string) {
        const startIndex = text.length + insertOffset;
        text += segment;
        const endIndex = text.length + insertOffset;
        boldRanges.push({ startIndex, endIndex });
        headingRanges.push({ startIndex, endIndex });
        centeredRanges.push({ startIndex, endIndex });
    }

    const categories = [...cats.values()]
        .sort((a, b) => a.id - b.id)
        .map(cat => ({ ...cat, items: [...cat.items].sort((a, b) => a.itemNumber - b.itemNumber) }));

    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    let itemCount = 0;

    for (const category of categories) {
        for (const item of category.items) {
            itemCount++;
            const isLast = itemCount === totalItems;

            addHeadingBoldCentered(`${item.itemNumber}. ${item.name}\n`);
            addCentered(`${item.description}\n`);
            if (item.details) {
                addBoldCentered(`Details: ${item.details}\n`);
            }
            if (item.value) {
                const valText = item.value === 'priceless' ? 'Value: Priceless\n' : `Value: $${item.value}\n`;
                addBoldCentered(valText);
            }
            addCentered(`Thanks to: ${item.donorDisplay}\n`);

            tableInsertionPoints.push({ position: text.length + insertOffset, item, isLast });
        }
    }

    return { text, boldRanges, headingRanges, centeredRanges, tableInsertionPoints };
}

function makeBoldRequests(ranges: Array<{ startIndex: number; endIndex: number }>): object[] {
    return ranges.map(({ startIndex, endIndex }) => ({
        updateTextStyle: {
            range: { startIndex, endIndex },
            textStyle: { bold: true },
            fields: 'bold',
        },
    }));
}

function makeHeading1Requests(ranges: Array<{ startIndex: number; endIndex: number }>): object[] {
    return ranges.map(({ startIndex, endIndex }) => ({
        updateParagraphStyle: {
            range: { startIndex, endIndex },
            paragraphStyle: { namedStyleType: 'HEADING_1' },
            fields: 'namedStyleType',
        },
    }));
}

function makeCenteringRequests(ranges: Array<{ startIndex: number; endIndex: number }>): object[] {
    return ranges.map(({ startIndex, endIndex }) => ({
        updateParagraphStyle: {
            range: { startIndex, endIndex },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
        },
    }));
}

export async function createBidSheetDoc(cats: Map<string, ItemCategory>): Promise<string> {
    const title = `Bid Sheets ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;

    const createResp = await gapi.client.docs.documents.create({ resource: { title } });
    const { documentId } = createResp.result;
    if (!documentId) throw new Error('Document creation failed: no documentId returned');

    const insertOffset = 1;
    const { text, boldRanges, headingRanges, centeredRanges, tableInsertionPoints } = buildBidSheetContent(cats, insertOffset);
    if (!text) return `https://docs.google.com/document/d/${documentId}/edit`;

    const finalEndIndex = insertOffset + text.length;

    // Phase 1: Insert all item text and apply formatting
    await gapi.client.docs.documents.batchUpdate({
        documentId,
        resource: {
            requests: [
                { insertText: { location: { index: insertOffset }, text } },
                {
                    updateTextStyle: {
                        range: { startIndex: insertOffset, endIndex: finalEndIndex },
                        textStyle: {
                            bold: false,
                            weightedFontFamily: { fontFamily: 'Times New Roman' },
                            fontSize: { magnitude: 12, unit: 'PT' },
                        },
                        fields: 'bold,weightedFontFamily,fontSize',
                    },
                },
                ...makeHeading1Requests(headingRanges),
                ...makeBoldRequests(boldRanges),
                ...makeCenteringRequests(centeredRanges),
            ],
        },
    });

    // Phase 2: Insert bid tables in reverse document order so earlier indices aren't shifted
    const tableRequests = [...tableInsertionPoints].reverse().flatMap(point => {
        if (point.item.bidSheetType === 'A') {
            return [{
                insertTable: {
                    rows: BID_TABLE_ROWS,
                    columns: BID_TABLE_COLS,
                    location: { index: point.position },
                },
            }];
        }
        // TODO: type B table
        // TODO: type C table
        return [];
    });

    if (tableRequests.length === 0) {
        // No tables: just insert page breaks in reverse order, skipping the last item
        const pageBreakPositions = tableInsertionPoints.filter(p => !p.isLast).map(p => p.position);
        if (pageBreakPositions.length > 0) {
            await gapi.client.docs.documents.batchUpdate({
                documentId,
                resource: {
                    requests: [...pageBreakPositions].reverse().map(index => ({
                        insertPageBreak: { location: { index } },
                    })),
                },
            });
        }
        return `https://docs.google.com/document/d/${documentId}/edit`;
    }

    await gapi.client.docs.documents.batchUpdate({
        documentId,
        resource: { requests: tableRequests },
    });

    // Phase 3: Read document to get table cell indices, then fill cells + format headers + page breaks
    const docResp = await gapi.client.docs.documents.get({ documentId });
    const tableEls = docResp.result.body!.content!.filter(el => !!el.table);

    // tableEls is in document order and maps 1:1 to type A entries in tableInsertionPoints
    const typeAPoints = tableInsertionPoints.filter(p => p.item.bidSheetType === 'A');
    const contentLengths = typeAPoints.map(p => typeACellContentLength(p.item));
    // cumContent[k] = sum of contentLengths[0..k] (inclusive), used for position shift accounting
    const cumContent = contentLengths.map((_, k) =>
        contentLengths.slice(0, k + 1).reduce((a, b) => a + b, 0)
    );

    // Build cell fill requests for all type A tables
    // Sorted descending by index so earlier indices aren't shifted by later inserts
    const cellFillData: Array<{ index: number; text: string }> = [];
    typeAPoints.forEach((point, k) => {
        const table = tableEls[k].table!;
        // 2D array of paragraph start indices: cellStartIndices[row][col]
        const cellStartIndices: number[][] = table.tableRows!.map(row =>
            row.tableCells!.map(cell => cell.content![0].startIndex!)
        );

        cellFillData.push({ index: cellStartIndices[0][0], text: 'Bid' });
        cellFillData.push({ index: cellStartIndices[0][1], text: 'Bidder' });
        for (let row = 1; row < BID_TABLE_ROWS; row++) {
            const amount = point.item.minBid + (row - 1) * point.item.bidIncrement;
            cellFillData.push({ index: cellStartIndices[row][0], text: formatBidAmount(amount) });
        }
    });
    cellFillData.sort((a, b) => b.index - a.index);
    const cellFillRequests = cellFillData.map(({ index, text: cellText }) => ({
        insertText: { location: { index }, text: cellText },
    }));

    // Header formatting (bold + centering for row 0 of each table)
    // Row 1-20 fills are at higher indices than row 0 so they don't shift it.
    // Fills from tables 0..k-1 DO shift table k, tracked via cellFillShiftBefore.
    const headerFormatRequests: object[] = [];
    let cellFillShiftBefore = 0;
    typeAPoints.forEach((_, k) => {
        const table = tableEls[k].table!;
        const cell00Idx = table.tableRows![0].tableCells![0].content![0].startIndex!;
        const cell01Idx = table.tableRows![0].tableCells![1].content![0].startIndex!;

        const bidLen = 'Bid'.length;       // 3
        const bidderLen = 'Bidder'.length; // 6

        // (0,0) shifts only from tables before it; (0,1) additionally shifts from (0,0)'s own fill
        const cell00Start = cell00Idx + cellFillShiftBefore;
        const cell01Start = cell01Idx + cellFillShiftBefore + bidLen;

        headerFormatRequests.push(
            {
                updateTextStyle: {
                    range: { startIndex: cell00Start, endIndex: cell00Start + bidLen },
                    textStyle: { bold: true },
                    fields: 'bold',
                },
            },
            {
                updateParagraphStyle: {
                    range: { startIndex: cell00Start, endIndex: cell00Start + bidLen + 1 },
                    paragraphStyle: { alignment: 'CENTER' },
                    fields: 'alignment',
                },
            },
            {
                updateTextStyle: {
                    range: { startIndex: cell01Start, endIndex: cell01Start + bidderLen },
                    textStyle: { bold: true },
                    fields: 'bold',
                },
            },
            {
                updateParagraphStyle: {
                    range: { startIndex: cell01Start, endIndex: cell01Start + bidderLen + 1 },
                    paragraphStyle: { alignment: 'CENTER' },
                    fields: 'alignment',
                },
            },
        );
        cellFillShiftBefore += contentLengths[k];
    });

    // Page break requests (after all cell fills; positions account for all shifts)
    // cumulativeShift tracks (emptyTableSize + cellContent) for all preceding type A tables
    const pageBreakData: Array<{ position: number }> = [];
    let typeAIdx = 0;
    let cumulativeShift = 0;
    for (const point of tableInsertionPoints) {
        if (point.isLast) break;
        if (point.item.bidSheetType === 'A') {
            const tableEl = tableEls[typeAIdx];
            const emptyTableSize = tableEl.endIndex! - tableEl.startIndex!;
            pageBreakData.push({ position: tableEl.endIndex! + cumContent[typeAIdx] });
            cumulativeShift += emptyTableSize + contentLengths[typeAIdx];
            typeAIdx++;
        } else {
            // B/C stub: page break at text-end position adjusted for all preceding type A tables + fills
            pageBreakData.push({ position: point.position + cumulativeShift });
        }
    }
    pageBreakData.sort((a, b) => b.position - a.position);
    const pageBreakRequests = pageBreakData.map(({ position }) => ({
        insertPageBreak: { location: { index: position } },
    }));

    const allRequests = [...cellFillRequests, ...headerFormatRequests, ...pageBreakRequests];
    if (allRequests.length > 0) {
        await gapi.client.docs.documents.batchUpdate({
            documentId,
            resource: { requests: allRequests },
        });
    }

    return `https://docs.google.com/document/d/${documentId}/edit`;
}
