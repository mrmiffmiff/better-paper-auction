import { Button } from '@/components/ui/button'

interface SuccessScreenProps {
  onRetry: () => void;
  onLogout: () => void;
}

export function SuccessScreen({ onRetry, onLogout }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p>Document creation successful</p>
      <div className="flex gap-2">
        <Button onClick={onRetry}>Retry</Button>
        <Button variant="outline" onClick={onLogout}>Logout</Button>
      </div>
    </div>
  )
}
