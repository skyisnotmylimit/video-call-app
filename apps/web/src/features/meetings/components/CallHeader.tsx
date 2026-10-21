import { useState } from 'react'
import { ConnectionState } from 'livekit-client'
import { useConnectionState, useParticipants } from '@livekit/components-react'
import { Aperture, Check, Copy, Link, Users, X } from 'lucide-react'

export function CallHeader({ code }: { code: string }) {
    const participants = useParticipants()
    const connection = useConnectionState()
    const [sharing, setSharing] = useState(true)
    const [copied, setCopied] = useState('')
    const [copyError, setCopyError] = useState('')
    const link = new URL(window.location.pathname, window.location.origin)
    link.searchParams.set('room', code)

    async function copy(value: string, kind: string) {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(kind)
            setCopyError('')
        } catch {
            setCopyError('Clipboard unavailable. Select and copy the meeting code below.')
        }
    }

    return <>
        <header className="call-header">
            <div className="call-title"><Aperture size={26} aria-hidden="true" /><span>gather<span className="brand-dot">.</span></span><span className="header-separator" /><code>{code}</code></div>
            <div className="call-header-actions"><span className="connection-state"><span className={`status-dot ${connection === ConnectionState.Connected ? '' : 'pending'}`} />{connection === ConnectionState.Connected ? 'Connected' : connection === ConnectionState.Reconnecting || connection === ConnectionState.SignalReconnecting ? 'Reconnecting...' : 'Connecting...'}</span>
                <span className="participant-count" title={`${participants.length} participants`}><Users size={17} aria-hidden="true" /> {participants.length}</span>
                <button className="button share-button" onClick={() => setSharing(!sharing)} aria-expanded={sharing}><Link size={17} aria-hidden="true" /> Invite</button>
            </div>
        </header>
        {sharing && <section className="share-panel" aria-label="Meeting invitation">
            <div className="share-heading"><h2>Your meeting is ready.</h2><button className="icon-button" aria-label="Close invitation" title="Close invitation" onClick={() => setSharing(false)}><X size={18} /></button></div>
            <label htmlFor="share-code">Meeting code</label>
            <div className="share-code-row"><input id="share-code" value={code} readOnly onFocus={(event) => event.target.select()} /><button className="icon-button" title="Copy meeting code" aria-label="Copy meeting code" onClick={() => { void copy(code, 'code') }}>{copied === 'code' ? <Check size={18} /> : <Copy size={18} />}</button></div>
            <button className="button primary" onClick={() => { void copy(link.toString(), 'link') }}>{copied === 'link' ? <Check size={17} aria-hidden="true" /> : <Link size={17} aria-hidden="true" />}{copied === 'link' ? 'Link copied' : 'Copy invite link'}</button>
            <span className="sr-only" role="status">{copied === 'code' ? 'Meeting code copied' : ''}</span>
            {copyError && <p className="error-text" role="alert">{copyError}</p>}
        </section>}
    </>
}