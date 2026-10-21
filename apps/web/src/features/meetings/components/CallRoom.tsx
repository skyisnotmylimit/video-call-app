import { useState } from 'react'
import type { RoomOptions } from 'livekit-client'
import { LiveKitRoom, VideoConference, type LocalUserChoices } from '@livekit/components-react'
import { X } from 'lucide-react'
import type { MeetingSession } from '@gather/contracts'
import { CallHeader } from './CallHeader'

interface CallRoomProps {
    session: MeetingSession
    choices: LocalUserChoices
    onLeave(): void
}

const roomOptions: RoomOptions = { adaptiveStream: true, dynacast: true }

export default function CallRoom({ session, choices, onLeave }: CallRoomProps) {
    const [error, setError] = useState('')

    return <main className="call-page" data-lk-theme="default">
        <LiveKitRoom serverUrl={session.serverUrl} token={session.token}
            audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId || undefined } : false}
            video={choices.videoEnabled ? { deviceId: choices.videoDeviceId || undefined } : false}
            options={roomOptions} onDisconnected={onLeave}
            onError={(cause) => setError(cause.message)}
            onMediaDeviceFailure={() => setError('A camera or microphone is unavailable. Check permissions or select a different device.')}>
            <CallHeader code={session.code} />
            {error && <div className="call-error" role="alert"><span>{error}</span><button className="button secondary" onClick={onLeave}>Leave meeting</button><button className="icon-button" aria-label="Dismiss message" title="Dismiss message" onClick={() => setError('')}><X size={18} /></button></div>}
            <div className="conference"><VideoConference /></div>
        </LiveKitRoom>
    </main>
}