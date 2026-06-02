import { Button } from '@/components/ui/button'

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center max-w-xs">
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight text-foreground">Better Paper Auction</p>
        <p className="text-sm text-muted-foreground">
          Auction document and email management, powered by Google Workspace.
        </p>
      </div>
      <Button onClick={onLogin}>Sign in with Google</Button>
    </div>
  )
}
