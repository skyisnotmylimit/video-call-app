import { z } from 'zod'

export const meetingCodeSchema = z.string().trim().toLowerCase().regex(
    /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/,
    'Enter a valid meeting code (xxxx-xxxx-xxxx).',
)

const displayNameSchema = z.string().trim().min(1, 'Enter your name.').max(60, 'Use 60 characters or fewer.')

export const meetingRequestSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('create'), displayName: displayNameSchema }),
    z.object({ action: z.literal('join'), displayName: displayNameSchema, code: meetingCodeSchema }),
])

export const meetingSessionSchema = z.object({
    code: meetingCodeSchema,
    token: z.string().min(1),
    serverUrl: z.url(),
})

export type MeetingRequest = z.infer<typeof meetingRequestSchema>
export type MeetingSession = z.infer<typeof meetingSessionSchema>