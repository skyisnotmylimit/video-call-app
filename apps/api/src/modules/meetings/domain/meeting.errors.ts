export class MeetingNotFoundError extends Error {
    constructor() {
        super('This meeting was not found or has ended. Check the code or create a new meeting.')
    }
}

export class ConfigurationError extends Error { }