import type { MeetingRequest, MeetingSession } from '@gather/contracts'

export interface MeetingApi {
  enter(request: MeetingRequest): Promise<MeetingSession>
}