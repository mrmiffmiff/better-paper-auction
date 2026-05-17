import type { ItemCategory } from './basicItemData';

const HEADERS = [
    'Item/Event Name',
    'Item/Event Number',
    'Individual Quantity',
    'Bidder Name',
    'Winning Amount',
    'Total Amount',
    'Total FMV',
    'Bidder Email',
    'Spouse Name',
    'Spouse Email',
    'Event Date',
    'Donor Name',
    'Donor Email',
    'Donor Display Name',
    'FMV',
    'Value',
];

export async function createExpandedSheet(cats: Map<string, ItemCategory>, spreadsheetId: string): Promise<string> {
    const sortedCats = [...cats.values()]
        .sort((a, b) => a.id - b.id)
        .map(cat => ({ ...cat, items: [...cat.items].sort((a, b) => a.itemNumber - b.itemNumber) }));

    const values: (string | number)[][] = [HEADERS];
    for (const cat of sortedCats) {
        for (const item of cat.items) {
            for (let i = 0; i < item.quantity; i++) {
                values.push(['', item.itemNumber]);
            }
        }
    }

    const addResponse = await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [{ addSheet: { properties: { title: 'Expanded Items' } } }],
        },
    });
    const newSheetId: number = addResponse.result.replies![0].addSheet!.properties!.sheetId!;

    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Expanded Items!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values },
    });

    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [{
                repeatCell: {
                    range: {
                        sheetId: newSheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: HEADERS.length,
                    },
                    cell: {
                        userEnteredFormat: {
                            textFormat: { bold: true },
                        },
                    },
                    fields: 'userEnteredFormat.textFormat.bold',
                },
            }],
        },
    });

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${newSheetId}`;
}
