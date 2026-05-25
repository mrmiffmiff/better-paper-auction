import { loadGmailApi } from './gapiClient';

export interface SendResult {
    sent: number;
    errors: string[];
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function attemptSend(draftId: string): Promise<void> {
    await gapi.client.gmail.users.drafts.send({
        userId: 'me',
        resource: { id: draftId },
    });
}

export async function sendDrafts(
    drafts: Array<{ id: string; name: string }>,
): Promise<SendResult> {
    await loadGmailApi();

    let sent = 0;
    const errors: string[] = [];

    // Pass 1
    const retry1: typeof drafts = [];
    for (const draft of drafts) {
        try {
            await attemptSend(draft.id);
            sent++;
        } catch {
            retry1.push(draft);
        }
    }

    if (retry1.length === 0) return { sent, errors };

    // Pass 2
    await sleep(1000);
    const retry2: typeof drafts = [];
    for (const draft of retry1) {
        console.warn(`Retrying send for "${draft.name}" (attempt 2)`);
        try {
            await attemptSend(draft.id);
            sent++;
        } catch {
            retry2.push(draft);
        }
    }

    if (retry2.length === 0) return { sent, errors };

    // Pass 3
    await sleep(2000);
    for (const draft of retry2) {
        console.warn(`Retrying send for "${draft.name}" (attempt 3)`);
        try {
            await attemptSend(draft.id);
            sent++;
        } catch (err) {
            console.error(`Failed to send draft for "${draft.name}" after 3 attempts:`, err);
            errors.push(draft.name);
        }
    }

    return { sent, errors };
}
