import type { ReactNode } from 'react'
import { Aperture, Video } from 'lucide-react'

interface AppLayoutProps {
    children: ReactNode
    onHome(): void
}

export function AppLayout({ children, onHome }: AppLayoutProps) {
    return <div className="app-shell">
        <header className="site-header">
            <a className="brand" href="/" aria-label="Gather home" onClick={(event) => { event.preventDefault(); onHome() }}>
                <Aperture size={30} strokeWidth={1.7} aria-hidden="true" />
                <span>gather<span className="brand-dot">.</span></span>
            </a>
            <span className="header-note"><Video size={16} aria-hidden="true" /> A little more face time.</span>
        </header>
        {children}
        <footer className="site-footer"><span>Good conversations start with hello.</span><span>gather / stay connected</span></footer>
    </div>
}