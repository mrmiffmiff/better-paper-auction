import { Button } from '@/components/ui/button'

interface AuthErrorScreenProps {
  message: string;
  onTryAgain: () => void;
}

export function AuthErrorScreen({ message, onTryAgain }: AuthErrorScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" onClick={onTryAgain}>Try Again</Button>
    </div>
  )
}
