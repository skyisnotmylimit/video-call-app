import { Module } from '@nestjs/common'
import { LiveKitGateway } from './infrastructure/livekit.gateway.js'
import { MeetingService } from './application/meeting.service.js'
import { MeetingsController } from './presentation/meetings.controller.js'

@Module({
  controllers: [MeetingsController],
  providers: [
    { provide: LiveKitGateway, useFactory: () => new LiveKitGateway() },
    { provide: MeetingService, useFactory: (gateway: LiveKitGateway) => new MeetingService(gateway), inject: [LiveKitGateway] },
  ],
})
export class MeetingsModule {}