import type { SubmitEvent } from 'react'
import { ArrowRight, Keyboard, Plus } from 'lucide-react'

interface HomePageProps {
    code: string
    error: string
    onCodeChange(code: string): void
    onCreate(): void
    onJoin(event: SubmitEvent<HTMLFormElement>): void
}

export function HomePage({ code, error, onCodeChange, onCreate, onJoin }: HomePageProps) {
    return <main className="home-main">
        <section className="meeting-entry" aria-labelledby="home-title">
            <span className="eyebrow"><span className="status-dot" /> YOUR PEOPLE. ONE PLACE.</span>
            <h1 id="home-title">Video meetings.<br /><span>A little closer.</span></h1>
            <p className="intro">For the big ideas, the quick catch-ups,<br className="desktop-break" /> and everything in between.</p>
            <div className="entry-actions">
                <button className="button primary create-button" onClick={onCreate}>
                    <Plus size={20} aria-hidden="true" /> New meeting
                </button>
                <div className="divider"><span>or join your people</span></div>
                <form onSubmit={onJoin} className="join-form" noValidate>
                    <label className="sr-only" htmlFor="meeting-code">Meeting code</label>
                    <div className={`code-input ${error ? 'invalid' : ''}`}>
                        <Keyboard size={20} aria-hidden="true" />
                        <input id="meeting-code" value={code} onChange={(event) => onCodeChange(event.target.value)}
                            placeholder="Enter a meeting code" autoComplete="off" spellCheck={false} maxLength={32}
                            aria-invalid={!!error} aria-describedby={error ? 'code-error' : undefined} />
                    </div>
                    <button className="button join-button" type="submit" disabled={!code.trim()}>Join <ArrowRight size={18} aria-hidden="true" /></button>
                </form>
                {error && <p className="error-text" id="code-error" role="alert">{error}</p>}
            </div>
            <div className="entry-footnote"><span className="small-rule" /> Less distance. More connection.</div>
        </section>
        <figure className="home-visual">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85"
                alt="A team sharing a conversation around a table" width="1200" height="900" fetchPriority="high" />
            <figcaption><span className="photo-label"><span className="status-dot" /> BETTER TOGETHER</span><span>There's a place for you here.</span></figcaption>
        </figure>
    </main>
}