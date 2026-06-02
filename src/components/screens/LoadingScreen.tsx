import { LoaderCircle } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading spreadsheet data…</p>
        </div>
    )
}
