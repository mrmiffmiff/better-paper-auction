import type { ItemData, ItemCategory } from './basicItemData';

const BID_TYPE_A_ROWS = 21; // 1 header + 20 bid rows
const BID_TYPE_A_COLS = 2;
const BID_TYPE_B_COLS = 4;
const BID_TYPE_C_ROWS = 20;

function formatBidAmount(amount: number): string {
    return `$${amount}`;
}

function typeBSubTableCount(quantity: number): number {
    if (quantity <= 4) return 3;
    if (quantity <= 8) return 2;
    return 1;
}

function cellContentLengthFor(item: ItemData, subTableIndex = 0): number {
    switch (item.bidSheetType) {
        case 'A': {
            let len = 'Bid'.length + 'Bidder'.length;
            for (let k = 0; k < 20; k++) len += formatBidAmount(item.minBid + k * item.bidIncrement).length;
            return len;
        }
        case 'B':
            // Only the 4 header cells have content; body rows are blank
            return Array.from({ length: BID_TYPE_B_COLS }, (_, c) =>
                formatBidAmount(item.minBid + (subTableIndex * BID_TYPE_B_COLS + c) * item.bidIncrement).length
            ).reduce((a, b) => a + b, 0);
        case 'C': {
            // 20 rows × quantity cols, same bid amount per row across all cols
            let len = 0;
            for (let r = 0; r < BID_TYPE_C_ROWS; r++)
                len += item.quantity * formatBidAmount(item.minBid + r * item.bidIncrement).length;
            return len;
        }
        default: return 0;
    }
}

function buildCellFillData(item: ItemData, cellStartIndices: number[][], subTableIndex = 0): Array<{ index: number; text: string }> {
    const fills: Array<{ index: number; text: string }> = [];
    switch (item.bidSheetType) {
        case 'A':
            fills.push({ index: cellStartIndices[0][0], text: 'Bid' });
            fills.push({ index: cellStartIndices[0][1], text: 'Bidder' });
            for (let row = 1; row < BID_TYPE_A_ROWS; row++) {
                fills.push({ index: cellStartIndices[row][0], text: formatBidAmount(item.minBid + (row - 1) * item.bidIncrement) });
            }
            break;
        case 'B':
            for (let c = 0; c < BID_TYPE_B_COLS; c++) {
                fills.push({ index: cellStartIndices[0][c], text: formatBidAmount(item.minBid + (subTableIndex * BID_TYPE_B_COLS + c) * item.bidIncrement) });
            }
            break;
        case 'C':
            for (let r = 0; r < BID_TYPE_C_ROWS; r++) {
                const text = formatBidAmount(item.minBid + r * item.bidIncrement);
                for (let c = 0; c < item.quantity; c++) {
                    fills.push({ index: cellStartIndices[r][c], text });
                }
            }
            break;
    }
    return fills;
}

function headerTextsFor(item: ItemData, subTableIndex = 0): string[] | null {
    switch (item.bidSheetType) {
        case 'A': return ['Bid', 'Bidder'];
        case 'B': return Array.from({ length: BID_TYPE_B_COLS }, (_, c) =>
            formatBidAmount(item.minBid + (subTableIndex * BID_TYPE_B_COLS + c) * item.bidIncrement));
        default: return null;
    }
}

function buildBidSheetContent(cats: Map<string, ItemCategory>, insertOffset: number): {
    text: string;
    boldRanges: Array<{ startIndex: number; endIndex: number }>;
    headingRanges: Array<{ startIndex: number; endIndex: number }>;
    centeredRanges: Array<{ startIndex: number; endIndex: number }>;
    tableInsertionPoints: Array<{ position: number; item: ItemData; isLastItem: boolean; isLastSubTable: boolean; subTableIndex: number }>;
} {
    let text = '';
    const boldRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const headingRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const centeredRanges: Array<{ startIndex: number; endIndex: number }> = [];
    const tableInsertionPoints: Array<{ position: number; item: ItemData; isLastItem: boolean; isLastSubTable: boolean; subTableIndex: number }> = [];

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
        // heading ranges handle both paragraph style (HEADING_1) and character style
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
            const isLastItem = itemCount === totalItems;

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

            // Insert table at the \n of the Thanks line (position - 1) to avoid a blank
            // paragraph that the Google Docs API inserts when a table is at a paragraph start.
            const tablePosition = text.length + insertOffset - 1;
            const subTableCount = item.bidSheetType === 'B' ? typeBSubTableCount(item.quantity) : 1;
            for (let t = 0; t < subTableCount; t++) {
                tableInsertionPoints.push({
                    position: tablePosition,
                    item,
                    isLastItem,
                    isLastSubTable: t === subTableCount - 1,
                    subTableIndex: t,
                });
            }
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

// Sets bold=true and clears explicit font/size overrides so the heading paragraphs
// inherit font and size from HEADING_1 consistently across all items.
function makeHeadingCharRequests(ranges: Array<{ startIndex: number; endIndex: number }>): object[] {
    return ranges.map(({ startIndex, endIndex }) => ({
        updateTextStyle: {
            range: { startIndex, endIndex },
            textStyle: { bold: true },
            fields: 'bold,fontSize,weightedFontFamily',
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
                ...makeHeadingCharRequests(headingRanges),
                ...makeBoldRequests(boldRanges),
                ...makeCenteringRequests(centeredRanges),
            ],
        },
    });

    // Phase 2: Insert bid tables in reverse document order so earlier indices aren't shifted
    const tableRequests = [...tableInsertionPoints].reverse().flatMap(point => {
        const { bidSheetType, quantity } = point.item;
        if (bidSheetType === 'A') {
            return [{ insertTable: { rows: BID_TYPE_A_ROWS, columns: BID_TYPE_A_COLS, location: { index: point.position } } }];
        }
        if (bidSheetType === 'B') {
            return [{ insertTable: { rows: 1 + quantity, columns: BID_TYPE_B_COLS, location: { index: point.position } } }];
        }
        if (bidSheetType === 'C') {
            return [{ insertTable: { rows: BID_TYPE_C_ROWS, columns: quantity, location: { index: point.position } } }];
        }
        return [];
    });

    if (tableRequests.length === 0) {
        // No tables: just insert page breaks in reverse order, skipping the last item
        const pageBreakPositions = tableInsertionPoints
            .filter(p => p.isLastSubTable && !p.isLastItem)
            .map(p => p.position);
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

    // Phase 3: Read document to get table cell indices, then fill cells + format + page breaks
    const docResp = await gapi.client.docs.documents.get({ documentId });
    const tableEls = docResp.result.body!.content!.filter(el => !!el.table);

    // allTablePoints maps 1:1 to tableEls in document order
    const allTablePoints = tableInsertionPoints.filter(p => ['A', 'B', 'C'].includes(p.item.bidSheetType));
    const contentLengths = allTablePoints.map(p => cellContentLengthFor(p.item, p.subTableIndex));
    // cumContent[k] = sum of contentLengths[0..k] inclusive, used for position shift accounting
    const cumContent = contentLengths.map((_, k) =>
        contentLengths.slice(0, k + 1).reduce((a, b) => a + b, 0)
    );

    // Collect per-table data in one pass (cell start indices used for both fills and formatting)
    const tables = allTablePoints.map((point, k) => {
        const tableEl = tableEls[k];
        const cellStartIndices: number[][] = tableEl.table!.tableRows!.map(row =>
            row.tableCells!.map(cell => cell.content![0].startIndex!)
        );
        return {
            tableEl,
            cellStartIndices,
            cellFills: buildCellFillData(point.item, cellStartIndices, point.subTableIndex),
            headerTexts: headerTextsFor(point.item, point.subTableIndex),
        };
    });

    // Cell fill requests: sorted descending so earlier indices aren't shifted by later inserts
    const cellFillData = tables.flatMap(t => t.cellFills);
    cellFillData.sort((a, b) => b.index - a.index);
    const cellFillRequests = cellFillData.map(({ index, text: cellText }) => ({
        insertText: { location: { index }, text: cellText },
    }));

    // Formatting requests:
    // Layer 1 — base reset to 12pt, not-bold (covers all cells in the table)
    // Layer 2 — header override to 14pt, bold, centered (types A and B row 0 only)
    // Layer 1 must precede layer 2 for each table so the override takes effect.
    // Fills from tables 0..k-1 shift table k's positions; tracked via cellFillShiftBefore.
    const formatRequests: object[] = [];
    let cellFillShiftBefore = 0;
    tables.forEach(({ tableEl, cellStartIndices, headerTexts }, k) => {
        const prevCumContent = cellFillShiftBefore;
        const curCumContent = cumContent[k];

        // Layer 1: reset all table content to 12pt, not-bold
        formatRequests.push({
            updateTextStyle: {
                range: {
                    startIndex: tableEl.startIndex! + prevCumContent,
                    endIndex: tableEl.endIndex! + curCumContent,
                },
                textStyle: { bold: false, fontSize: { magnitude: 12, unit: 'PT' } },
                fields: 'bold,fontSize',
            },
        });

        // Layer 2: header row to 14pt, bold, centered (types A and B)
        if (headerTexts) {
            let headerShift = 0;
            headerTexts.forEach((headerText, c) => {
                const cellStart = cellStartIndices[0][c] + prevCumContent + headerShift;
                const cellEnd = cellStart + headerText.length;
                formatRequests.push(
                    {
                        updateTextStyle: {
                            range: { startIndex: cellStart, endIndex: cellEnd },
                            textStyle: { bold: true, fontSize: { magnitude: 14, unit: 'PT' } },
                            fields: 'bold,fontSize',
                        },
                    },
                    {
                        updateParagraphStyle: {
                            range: { startIndex: cellStart, endIndex: cellEnd + 1 },
                            paragraphStyle: { alignment: 'CENTER' },
                            fields: 'alignment',
                        },
                    },
                );
                headerShift += headerText.length;
            });
        }

        cellFillShiftBefore += contentLengths[k];
    });

    // Page break requests (after all cell fills; positions account for all shifts)
    // cumulativeShift tracks (emptyTableSize + cellContent) for all preceding tables
    const pageBreakData: Array<{ position: number }> = [];
    let tableIdx = 0;
    let cumulativeShift = 0;
    for (const point of tableInsertionPoints) {
        const hasTable = ['A', 'B', 'C'].includes(point.item.bidSheetType);
        if (hasTable) {
            const tableEl = tableEls[tableIdx];
            const emptyTableSize = tableEl.endIndex! - tableEl.startIndex!;
            if (point.isLastSubTable && !point.isLastItem) {
                pageBreakData.push({ position: tableEl.endIndex! + cumContent[tableIdx] });
            }
            cumulativeShift += emptyTableSize + contentLengths[tableIdx];
            tableIdx++;
        } else if (!point.isLastItem) {
            pageBreakData.push({ position: point.position + cumulativeShift });
        }
    }
    pageBreakData.sort((a, b) => b.position - a.position);
    const pageBreakRequests = pageBreakData.map(({ position }) => ({
        insertPageBreak: { location: { index: position } },
    }));

    const allRequests = [...cellFillRequests, ...formatRequests, ...pageBreakRequests];
    if (allRequests.length > 0) {
        await gapi.client.docs.documents.batchUpdate({
            documentId,
            resource: { requests: allRequests },
        });
    }

    return `https://docs.google.com/document/d/${documentId}/edit`;
}
