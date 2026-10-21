export interface MeetingGateway {
    createRoom(code: string): Promise<void>
    roomExists(code: string): Promise<boolean>
    issueToken(code: string, identity: string, displayName: string): Promise<string>
    readonly serverUrl: string
}