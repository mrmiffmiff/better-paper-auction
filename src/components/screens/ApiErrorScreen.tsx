import { Button } from '@/components/ui/button'

interface ApiErrorScreenProps {
  message: string;
  onRetry: () => void;
  onLogout: () => void;
}

export function ApiErrorScreen({ message, onRetry, onLogout }: ApiErrorScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-destructive">Document creation failed: {message}</p>
      <div className="flex gap-2">
        <Button onClick={onRetry}>Retry</Button>
        <Button variant="outline" onClick={onLogout}>Logout</Button>
      </div>
    </div>
  )
}
