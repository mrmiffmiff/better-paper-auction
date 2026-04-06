import { type Dispatch } from 'react'
import { Button } from '@/components/ui/button'
import { type AppAction } from '@/hooks/useAppReducer'

interface ReadyScreenProps {
  readonly onCreateDocument: () => void;
  readonly dispatch: Dispatch<AppAction>;
}

export function ReadyScreen({ onCreateDocument, dispatch }: ReadyScreenProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={onCreateDocument}>Create Document</Button>
      <Button onClick={() => dispatch({ type: 'PICK_SPREADSHEET' })}>Select Spreadsheet</Button>
    </div>
  )
}
