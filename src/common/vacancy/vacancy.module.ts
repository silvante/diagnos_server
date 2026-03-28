import { Module } from '@nestjs/common';
import { VacancyService } from './vacancy.service';
import { VacancyController } from './vacancy.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppJwtModule } from 'src/jwt/jwt.module';
import { GlobalModule } from 'src/global/global.module';

@Module({
  imports: [PrismaModule, AppJwtModule, GlobalModule],
  controllers: [VacancyController],
  providers: [VacancyService],
})
export class VacancyModule {}
