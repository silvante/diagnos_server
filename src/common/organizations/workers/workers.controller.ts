import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { OrganizationAccessGuard } from 'src/guards/organization-access/organization-access.guard';

@Controller('organizations/:org_id/workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @UseGuards(AuthGuard, OrganizationAccessGuard)
  @Get('requests')
  getJoinRequests(@Req() req: RequestWithUser) {
    return this.workersService.getJoinRequests(req);
  }

  @UseGuards(AuthGuard)
  @Post(':req_id/hire')
  create(
    @Req() req: RequestWithUser,
    @Param() params: { org_id: string; req_id: string },
    @Body() data: CreateWorkerDto,
  ) {
    return this.workersService.hire(
      req,
      { org_id: +params.org_id, req_id: +params.req_id },
      data,
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  getWorkers(@Req() req: RequestWithUser, @Param('org_id') org_id: string) {
    return this.workersService.getWorkers(req, +org_id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getAWorker(
    @Req() req: RequestWithUser,
    @Param() params: { org_id: string; id: string },
  ) {
    return this.workersService.getAWorker(req, {
      org_id: +params.org_id,
      id: +params.id,
    });
  }

  @UseGuards(AuthGuard)
  @Put(':id/update')
  updateWorker(
    @Req() req: RequestWithUser,
    @Param() params: { org_id: string; id: string },
    @Body() data: UpdateWorkerDto,
  ) {
    return this.workersService.updateWorker(
      req,
      { org_id: +params.org_id, id: +params.id },
      data,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':id/delete')
  deleteAWorker(
    @Req() req: RequestWithUser,
    @Param() params: { org_id: string; id: string },
  ) {
    return this.workersService.deleteAWorker(req, {
      org_id: +params.org_id,
      id: +params.id,
    });
  }
}
