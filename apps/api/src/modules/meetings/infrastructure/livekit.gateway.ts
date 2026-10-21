import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import type { MeetingGateway } from '../domain/meeting.gateway.js'
import { ConfigurationError } from '../domain/meeting.errors.js'

export class LiveKitGateway implements MeetingGateway {
    private configuration() {
        const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
        if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
            throw new ConfigurationError('Video service is not configured. Add the LiveKit environment variables to the backend.')
        }
        const httpUrl = new URL(LIVEKIT_URL)
        httpUrl.protocol = httpUrl.protocol === 'wss:' ? 'https:' : 'http:'
        return {
            serverUrl: LIVEKIT_URL,
            apiKey: LIVEKIT_API_KEY,
            apiSecret: LIVEKIT_API_SECRET,
            rooms: new RoomServiceClient(httpUrl.toString(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET),
        }
    }

    get serverUrl(): string {
        return this.configuration().serverUrl
    }

    async createRoom(code: string): Promise<void> {
        await this.configuration().rooms.createRoom({ name: code, emptyTimeout: 600, departureTimeout: 60, maxParticipants: 20 })
    }

    async roomExists(code: string): Promise<boolean> {
        return (await this.configuration().rooms.listRooms([code])).length > 0
    }

    async issueToken(code: string, identity: string, displayName: string): Promise<string> {
        const { apiKey, apiSecret } = this.configuration()
        const token = new AccessToken(apiKey, apiSecret, { identity, name: displayName, ttl: '15m' })
        token.addGrant({ roomJoin: true, room: code, canPublish: true, canSubscribe: true, canPublishData: true })
        return token.toJwt()
    }
}