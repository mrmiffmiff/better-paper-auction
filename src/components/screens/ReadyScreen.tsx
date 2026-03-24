import { Button } from '@/components/ui/button'

interface ReadyScreenProps {
  onCreateDocument: () => void;
}

export function ReadyScreen({ onCreateDocument }: ReadyScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={onCreateDocument}>Create Document</Button>
    </div>
  )
}
