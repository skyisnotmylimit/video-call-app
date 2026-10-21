import { afterEach, describe, expect, it, vi } from 'vitest'
import { meetingApi } from './meeting-api'

afterEach(() => { vi.unstubAllGlobals() })

describe('Meeting API client', () => {
    it('normalizes inputs and validates the returned session', async () => {
        const fetchMock = vi.fn().mockResolvedValue(Response.json({ code: 'abcd-efgh-jkmn', token: 'signed-token', serverUrl: 'wss://test.livekit.cloud' }))
        vi.stubGlobal('fetch', fetchMock)
        const session = await meetingApi.enter({ action: 'join', displayName: ' Sam ', code: ' ABCD-EFGH-JKMN ' })
        expect(session.code).toBe('abcd-efgh-jkmn')
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'join', displayName: 'Sam', code: 'abcd-efgh-jkmn' })
    })

    it('rejects invalid input without requesting a token', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        await expect(meetingApi.enter({ action: 'create', displayName: '' })).rejects.toThrow('Enter your name.')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('preserves actionable backend error messages', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'This meeting has ended.' }, { status: 404 })))
        await expect(meetingApi.enter({ action: 'create', displayName: 'Sam' })).rejects.toThrow('This meeting has ended.')
    })

    it('reports connection failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
        await expect(meetingApi.enter({ action: 'create', displayName: 'Sam' })).rejects.toThrow('Unable to reach the meeting server.')
    })

    it('rejects invalid session payloads', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ code: 'abcd-efgh-jkmn' })))
        await expect(meetingApi.enter({ action: 'create', displayName: 'Sam' })).rejects.toThrow('invalid meeting session')
    })
})