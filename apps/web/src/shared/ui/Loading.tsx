import { LoaderCircle } from 'lucide-react'

export function Loading() {
    return <div className="loading" role="status"><LoaderCircle className="spin" size={22} aria-hidden="true" /><span>Getting things ready...</span></div>
}