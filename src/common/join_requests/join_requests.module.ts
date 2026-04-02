import { Module } from '@nestjs/common';
import { JoinRequestsController } from './join_requests.controller';
import { JoinRequestsService } from './join_requests.service';

@Module({
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService]
})
export class JoinRequestsModule {}
