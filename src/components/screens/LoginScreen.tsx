import { Button } from '@/components/ui/button'

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={onLogin}>Sign in with Google</Button>
    </div>
  )
}
