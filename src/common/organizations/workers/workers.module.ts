import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppJwtModule } from 'src/jwt/jwt.module';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [PrismaModule, AppJwtModule, GlobalModule],
  controllers: [WorkersController],
  providers: [WorkersService],
})
export class WorkersModule {}
