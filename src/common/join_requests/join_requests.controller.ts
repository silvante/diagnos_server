import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JoinRequestsService } from './join_requests.service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';

@Controller('join-requests')
export class JoinRequestsController {
  constructor(private joinReqService: JoinRequestsService) {}

  @UseGuards(AuthGuard)
  @Get('/')
  getMyRequests(@Req() req: RequestWithUser) {
    return;
  }
}
