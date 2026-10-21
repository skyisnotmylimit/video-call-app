import { randomInt, randomUUID } from 'node:crypto'
import type { MeetingRequest, MeetingSession } from '@gather/contracts'
import type { MeetingGateway } from '../domain/meeting.gateway.js'
import { MeetingNotFoundError } from '../domain/meeting.errors.js'

export class MeetingService {
    constructor(private readonly gateway: MeetingGateway) { }

    async enter(request: MeetingRequest): Promise<MeetingSession> {
        let code: string

        if (request.action === 'create') {
            const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
            const characters = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)])
            code = [0, 4, 8].map((offset) => characters.slice(offset, offset + 4).join('')).join('-')
            await this.gateway.createRoom(code)
        } else {
            code = request.code
            if (!(await this.gateway.roomExists(code))) throw new MeetingNotFoundError()
        }

        const token = await this.gateway.issueToken(code, randomUUID(), request.displayName)
        return { code, token, serverUrl: this.gateway.serverUrl }
    }
}