import { ArrowLeft } from 'lucide-react'
import type { MeetingSession } from '@gather/contracts'
import type { LocalUserChoices } from '@livekit/components-react'
import MeetingPreview from '../../features/meetings/components/MeetingPreview'
import { meetingApi } from '../../features/meetings/api/meeting-api'

interface MeetingPreviewPageProps {
    code?: string
    onBack(): void
    onReady(session: MeetingSession, choices: LocalUserChoices): void
}

export default function MeetingPreviewPage({ code, onBack, onReady }: MeetingPreviewPageProps) {
    return <main className="preview-main">
        <button className="back-link" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Back</button>
        <div className="section-heading"><span className="eyebrow">{code ? code : 'A NEW CONVERSATION'}</span>
            <h1>{code ? 'Ready to join?' : 'Make yourself at home.'}</h1>
        </div>
        <MeetingPreview api={meetingApi} code={code} onReady={onReady} />
    </main>
}