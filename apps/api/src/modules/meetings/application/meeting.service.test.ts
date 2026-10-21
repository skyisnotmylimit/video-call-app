import { describe, expect, it, vi } from 'vitest'
import { meetingCodeSchema } from '@gather/contracts'
import { MeetingService } from './meeting.service.js'
import { MeetingNotFoundError } from '../domain/meeting.errors.js'
import type { MeetingGateway } from '../domain/meeting.gateway.js'

function gateway(): MeetingGateway {
    return {
        serverUrl: 'wss://test.livekit.cloud',
        createRoom: vi.fn().mockResolvedValue(undefined),
        roomExists: vi.fn().mockResolvedValue(true),
        issueToken: vi.fn().mockResolvedValue('signed-token'),
    }
}

describe('MeetingService', () => {
    it('creates a room and issues a token scoped to its code', async () => {
        const provider = gateway()
        const session = await new MeetingService(provider).enter({ action: 'create', displayName: 'Taylor' })
        expect(meetingCodeSchema.safeParse(session.code).success).toBe(true)
        expect(provider.createRoom).toHaveBeenCalledWith(session.code)
        expect(provider.issueToken).toHaveBeenCalledWith(session.code, expect.any(String), 'Taylor')
        expect(session.token).toBe('signed-token')
    })

    it('joins an existing room without creating another one', async () => {
        const provider = gateway()
        await new MeetingService(provider).enter({ action: 'join', displayName: 'Sam', code: 'abcd-efgh-jkmn' })
        expect(provider.roomExists).toHaveBeenCalledWith('abcd-efgh-jkmn')
        expect(provider.createRoom).not.toHaveBeenCalled()
    })

    it('does not issue tokens for unknown rooms', async () => {
        const provider = gateway()
        vi.mocked(provider.roomExists).mockResolvedValue(false)
        await expect(new MeetingService(provider).enter({ action: 'join', displayName: 'Sam', code: 'abcd-efgh-jkmn' }))
            .rejects.toBeInstanceOf(MeetingNotFoundError)
        expect(provider.issueToken).not.toHaveBeenCalled()
    })

    it('uses different participant identities for the same display name', async () => {
        const provider = gateway()
        const service = new MeetingService(provider)
        await service.enter({ action: 'create', displayName: 'Sam' })
        await service.enter({ action: 'create', displayName: 'Sam' })
        const calls = vi.mocked(provider.issueToken).mock.calls
        expect(calls[0][1]).not.toBe(calls[1][1])
    })
})