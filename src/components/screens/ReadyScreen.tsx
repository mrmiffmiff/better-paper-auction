import { type Dispatch } from 'react'
import { Button } from '@/components/ui/button'
import { type AppAction } from '@/hooks/useAppReducer'

interface ReadyScreenProps {
  readonly dispatch: Dispatch<AppAction>;
}

export function ReadyScreen({ dispatch }: ReadyScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-xs">
      <p className="text-sm text-muted-foreground">
        Select a Google Sheets spreadsheet to load your auction data.
      </p>
      <Button onClick={() => dispatch({ type: 'PICK_SPREADSHEET' })}>
        Select Spreadsheet
      </Button>
    </div>
  )
}
