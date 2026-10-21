import { ArrowRight, Check } from 'lucide-react'

interface MeetingEndedPageProps {
    onHome(): void
    onRejoin(): void
}

export function MeetingEndedPage({ onHome, onRejoin }: MeetingEndedPageProps) {
    return <main className="ended-main">
        <div className="ended-mark"><Check size={32} aria-hidden="true" /></div>
        <span className="eyebrow">UNTIL NEXT TIME</span>
        <h1>You left the meeting.</h1>
        <div className="ended-actions">
            <button className="button primary" onClick={onHome}>Back to home</button>
            <button className="button secondary" onClick={onRejoin}>Rejoin meeting <ArrowRight size={18} aria-hidden="true" /></button>
        </div>
    </main>
}