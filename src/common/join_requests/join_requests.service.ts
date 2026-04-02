import { DeleteReceiptRuleRequest$ } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JoinRequestsService {
  constructor(private prisma: PrismaService) {}

  async GetMyRequest(req: RequestWithUser) {
    const requests = await this.prisma.joinRequest.findMany({
      where: {
        applicant_id: req.user.id,
      },
      include: {
        org: {
          select: {
            name: true,
            unique_name: true,
          },
        },
        applicant: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });
    return requests;
  }

  async newReq(req: RequestWithUser, org_unique_name: string, role: string) {
    const user = req.user;

    const new_req = await this.prisma.joinRequest.create({
      data: {
        role: role == 'doctor' ? 'doctor' : 'receptionist',
        applicant: {
          connect: {
            id: user.id,
          },
        },
        org: {
          connect: {
            unique_name: org_unique_name,
          },
        },
      },
      include: {
        org: {
          select: {
            name: true,
            unique_name: true,
          },
        },
        applicant: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    return new_req;
  }

  async deleteReq(req: RequestWithUser, id: number) {
    const user = req.user;

    await this.prisma.joinRequest.delete({
      where: { id: id, applicant_id: user.id },
    });

    return {
      deleted: true,
    };
  }
}
