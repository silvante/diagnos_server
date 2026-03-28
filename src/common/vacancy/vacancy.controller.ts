import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import { VacancyService } from './vacancy.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { WorkerRoles } from '@prisma/client';

@Controller('vacancy')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @Get('search')
  searchVacancyes(
    @Query('origin') origin: string = 'andijon',
    @Query('q') q: string = '',
    @Query('role') role: WorkerRoles | null = null,
    @Query('job') job: string | null = null,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.vacancyService.search(
      origin,
      q,
      role,
      job,
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(AuthGuard)
  @Get('access/:a_id')
  getByAccessID(@Param('a_id') a_id: string) {
    return this.vacancyService.getByAccessID(a_id);
  }

  @UseGuards(AuthGuard)
  @Post('create')
  create(
    @Req() req: RequestWithUser,
    @Body() createVacancyDto: CreateVacancyDto,
  ) {
    return this.vacancyService.create(req, createVacancyDto);
  }

  @UseGuards(AuthGuard)
  @Get('mine')
  findAllMyVacancies(@Req() req: RequestWithUser) {
    return this.vacancyService.findMyAll(req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacancyService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Put(':id/update')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateVacancyDto: UpdateVacancyDto,
  ) {
    return this.vacancyService.update(req, +id, updateVacancyDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/delete')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.vacancyService.remove(req, +id);
  }
}
