import { meetingRequestSchema, meetingSessionSchema } from '@gather/contracts'
import type { MeetingApi } from '../model/meeting-api'

export const meetingApi: MeetingApi = {
  async enter(request) {
    const validated = meetingRequestSchema.safeParse(request)
    if (!validated.success) throw new Error(validated.error.issues[0].message)

    let response: Response
    try {
      response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated.data),
        signal: AbortSignal.timeout(15_000),
      })
    } catch {
      throw new Error('Unable to reach the meeting server. Check your connection and try again.')
    }

    const data: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Unable to enter the meeting. Please try again.'
      throw new Error(message)
    }
    const session = meetingSessionSchema.safeParse(data)
    if (!session.success) throw new Error('The server returned an invalid meeting session.')
    return session.data
  },
}