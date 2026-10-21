import { BadGatewayException, BadRequestException, Body, Controller, HttpCode, Inject, NotFoundException, Post, ServiceUnavailableException } from '@nestjs/common'
import { meetingRequestSchema } from '@gather/contracts'
import { ConfigurationError, MeetingNotFoundError } from '../domain/meeting.errors.js'
import { MeetingService } from '../application/meeting.service.js'

@Controller('meetings')
export class MeetingsController {
  constructor(@Inject(MeetingService) private readonly meetings: MeetingService) { }

  @Post()
  @HttpCode(200)
  async enter(@Body() body: unknown) {
    const parsed = meetingRequestSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message)
    try {
      return await this.meetings.enter(parsed.data)
    } catch (error) {
      if (error instanceof MeetingNotFoundError) throw new NotFoundException(error.message)
      if (error instanceof ConfigurationError) throw new ServiceUnavailableException(error.message)
      throw new BadGatewayException('The video service is unavailable. Please try again.')
    }
  }
}