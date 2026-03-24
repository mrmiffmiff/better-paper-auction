import { Button } from '@/components/ui/button'

interface AuthErrorScreenProps {
  message: string;
  onTryAgain: () => void;
}

export function AuthErrorScreen({ message, onTryAgain }: AuthErrorScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-destructive">{message}</p>
      <Button onClick={onTryAgain}>Try Again</Button>
    </div>
  )
}
