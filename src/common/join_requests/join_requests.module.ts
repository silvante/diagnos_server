import { Module } from '@nestjs/common';
import { JoinRequestsController } from './join_requests.controller';
import { JoinRequestsService } from './join_requests.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppJwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PrismaModule, AppJwtModule],
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}
