import { lazy, Suspense, useState } from 'react'
import { meetingCodeSchema, type MeetingSession } from '@gather/contracts'
import type { LocalUserChoices } from '@livekit/components-react'
import { HomePage } from '../pages/home/HomePage'
import { MeetingEndedPage } from '../pages/meeting-ended/MeetingEndedPage'
import { AppLayout } from '../shared/layouts/AppLayout'
import { Loading } from '../shared/ui/Loading'

const MeetingPreviewPage = lazy(() => import('../pages/meeting-preview/MeetingPreviewPage'))
const CallRoom = lazy(() => import('../features/meetings/components/CallRoom'))

type Screen =
  | { kind: 'home' }
  | { kind: 'preview'; code?: string }
  | { kind: 'call'; session: MeetingSession; choices: LocalUserChoices }
  | { kind: 'ended'; code: string }

function initialScreen(): Screen {
  const code = meetingCodeSchema.safeParse(new URLSearchParams(window.location.search).get('room'))
  return code.success ? { kind: 'preview', code: code.data } : { kind: 'home' }
}

function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function goHome() {
    window.history.replaceState(null, '', window.location.pathname)
    setError('')
    setScreen({ kind: 'home' })
  }

  function joinMeeting(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = meetingCodeSchema.safeParse(code)
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    setError('')
    setScreen({ kind: 'preview', code: result.data })
  }

  if (screen.kind === 'call') {
    return <Suspense fallback={<Loading />}>
      <CallRoom session={screen.session} choices={screen.choices}
        onLeave={() => setScreen({ kind: 'ended', code: screen.session.code })} />
    </Suspense>
  }

  return (
    <AppLayout onHome={goHome}>
      {screen.kind === 'home' && <HomePage code={code} error={error}
        onCodeChange={(value) => { setCode(value); setError('') }}
        onCreate={() => setScreen({ kind: 'preview' })} onJoin={joinMeeting} />}

      {screen.kind === 'preview' && <Suspense fallback={<Loading />}>
        <MeetingPreviewPage code={screen.code} onBack={goHome}
          onReady={(session, choices) => setScreen({ kind: 'call', session, choices })} />
      </Suspense>}

      {screen.kind === 'ended' && <MeetingEndedPage onHome={goHome}
        onRejoin={() => setScreen({ kind: 'preview', code: screen.code })} />}
    </AppLayout>
  )
}

export default App