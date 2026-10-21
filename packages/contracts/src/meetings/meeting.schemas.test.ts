import { describe, expect, it } from 'vitest'
import { meetingRequestSchema } from './meeting.schemas.js'

describe('Meeting request validation', () => {
    it('normalizes shared codes and names', () => {
        expect(meetingRequestSchema.parse({ action: 'join', displayName: ' Sam ', code: ' ABCD-EFGH-JKMN ' }))
            .toEqual({ action: 'join', displayName: 'Sam', code: 'abcd-efgh-jkmn' })
    })

    it.each([
        { action: 'create', displayName: ' ' },
        { action: 'create', displayName: 'a'.repeat(61) },
        { action: 'join', displayName: 'Sam', code: '../../room' },
        { action: 'join', displayName: 'Sam', code: 'abcd-efgh' },
    ])('rejects malformed input: %j', (request) => {
        expect(meetingRequestSchema.safeParse(request).success).toBe(false)
    })
})