import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { UpdateClientDto } from './dto/update-client.dto';
import { OrganizationAccessGuard } from 'src/guards/organization-access/organization-access.guard';
import { ReceptionistAccessGuard } from 'src/guards/receptionist-access/receptionist-access.guard';
import { DoctorAccessGuard } from 'src/guards/doctor-access/doctor-access.guard';
import { SearchClientParamsDto } from './dto/search-clients.dto';
import { OwnerAccessGuard } from 'src/guards/owner-access/owner-access.guard';

@Controller('organizations/:org_id/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @UseGuards(AuthGuard, OrganizationAccessGuard, ReceptionistAccessGuard)
  @Post('new')
  create(
    @Req() req: RequestWithUser,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(req, createClientDto);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard, OwnerAccessGuard)
  @Get('search')
  searchClients(
    @Req() req: RequestWithUser,
    @Query() query: SearchClientParamsDto,
  ) {
    return this.clientsService.searchClients(req, query);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard)
  @Get('today')
  getTodaysClients(@Req() req: RequestWithUser) {
    return this.clientsService.findTodayClients(req);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard, DoctorAccessGuard)
  @Put('/:client_id/check/:diagnosis_id')
  checkClient(
    @Req() req: RequestWithUser,
    @Body('report') diagnosis: string,
    @Param('client_id') client_id: string,
    @Param('diagnosis_id') diagnosis_id: string,
  ) {
    return this.clientsService.checkClient(req, diagnosis, +client_id, +diagnosis_id);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard, ReceptionistAccessGuard)
  @Put('/:client_id/update')
  updateClient(
    @Req() req: RequestWithUser,
    @Param('client_id') client_id: string,
    @Body() data: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(req, +client_id, data);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard, ReceptionistAccessGuard)
  @Delete('/:client_id/delete')
  deleteClient(
    @Req() req: RequestWithUser,
    @Param('client_id') client_id: string,
  ) {
    return this.clientsService.DeleteClients(req, +client_id);
  }

  @UseGuards(AuthGuard, OrganizationAccessGuard, OwnerAccessGuard)
  @Get('date/:date')
  getByDate(
    @Req() req: RequestWithUser,
    @Param('date') date: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.clientsService.getClientsByDate(req, date, {
      page: +page,
      limit: +limit,
    });
  }
}
