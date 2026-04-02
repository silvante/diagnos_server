import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JoinRequestsService } from './join_requests.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';

@Controller('join-requests')
export class JoinRequestsController {
  constructor(private joinReqService: JoinRequestsService) {}

  @UseGuards(AuthGuard)
  @Get('/')
  getMyRequests(@Req() req: RequestWithUser) {
    return this.joinReqService.GetMyRequest(req);
  }

  @UseGuards(AuthGuard)
  @Post('new/:org_unique_name')
  sendNewRequest(
    @Req() req: RequestWithUser,
    @Param('org_unique_name') org_unique_name: string,
    @Body('role') role: string,
  ) {
    return this.joinReqService.newReq(req, org_unique_name, role);
  }

  @UseGuards(AuthGuard)
  @Delete('delete/:id')
  deleteReq(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.joinReqService.deleteReq(req, +id);
  }
}
