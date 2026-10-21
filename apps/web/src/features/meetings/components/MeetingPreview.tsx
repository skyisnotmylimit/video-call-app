import { useState } from 'react'
import { PreJoin, type LocalUserChoices } from '@livekit/components-react'
import { LoaderCircle } from 'lucide-react'
import type { MeetingSession } from '@gather/contracts'
import type { MeetingApi } from '../model/meeting-api'

interface MeetingPreviewProps {
  api: MeetingApi
  code?: string
  onReady(session: MeetingSession, choices: LocalUserChoices): void
}

export default function MeetingPreview({ api, code, onReady }: MeetingPreviewProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deviceError, setDeviceError] = useState('')

  async function enter(choices: LocalUserChoices) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const session = await api.enter(code
        ? { action: 'join', displayName: choices.username, code }
        : { action: 'create', displayName: choices.username })
      onReady(session, choices)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to enter the meeting.')
      setBusy(false)
    }
  }

  return <div className="preview-content" data-lk-theme="default">
    {deviceError && <p className="device-notice" role="status">{deviceError}</p>}
    <fieldset disabled={busy} className="preview-fieldset" aria-busy={busy}>
      <PreJoin onSubmit={(choices) => { void enter(choices) }}
        defaults={{ audioEnabled: true, videoEnabled: true }}
        onValidate={(choices) => choices.username.trim().length > 0 && choices.username.trim().length <= 60}
        onError={() => setDeviceError('Camera or microphone unavailable. Check browser permissions, choose another device, or join with them off.')}
        joinLabel={busy ? 'Connecting...' : code ? 'Join meeting' : 'Start meeting'}
        userLabel="Your name" micLabel="Microphone" camLabel="Camera" persistUserChoices />
    </fieldset>
    {busy && <p className="busy-message" role="status"><LoaderCircle size={16} className="spin" aria-hidden="true" /> Connecting to your meeting...</p>}
    {error && <div className="error-banner" role="alert">{error}</div>}
  </div>
}