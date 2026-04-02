import { HttpException, Injectable } from '@nestjs/common';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async getJoinRequests(req: RequestWithUser) {
    const org = req.organization;

    const requests = await this.prisma.joinRequest.findMany({
      where: { org_id: org.id, status: 'pending' },
    });

    return requests;
  }

  async hire(
    req: RequestWithUser,
    params: { org_id: number; req_id: number },
    data: CreateWorkerDto,
  ) {
    const user = req.user;
    const organization = await this.prisma.organization.findUnique({
      where: { owner_id: user.id, id: params.org_id },
      include: {
        workers: true,
      },
    });
    if (!organization) {
      throw new HttpException('Siz ushbu tashkilotga ega emassiz', 404);
    }
    const joinRequest = await this.prisma.joinRequest.findUnique({
      where: { id: params.req_id },
      include: {
        applicant: {
          select: {
            id: true,
            works: true,
          },
        },
      },
    });
    if (!joinRequest) {
      throw new HttpException('Vakansiya topilmadi', 404);
    }
    if (joinRequest.applicant.works && joinRequest.applicant.works.length > 0) {
      throw new HttpException(
        "Bu foydalanuvchining allaqachon ishi bor, u bilan bog'lanishingiz mumkin.",
        402,
      );
    }
    if (joinRequest.applicant_id === user.id) {
      throw new HttpException(
        "Bu sizning shaxsiy hisobingiz, o'zingizni ishga yollay olmaysiz.",
        402,
      );
    }
    const existing_worker = organization.workers.find(
      (w) => w.worker_id === joinRequest.applicant_id,
    );

    if (existing_worker) {
      throw new HttpException(
        'Siz allaqachon bir xil hisobga ega ishchini yollagansiz.',
        404,
      );
    }

    const { attached_types, role } = data;

    if (role === 'doctor' && attached_types) {
      const new_worker = await this.prisma.worker.create({
        data: {
          worker: {
            connect: {
              id: joinRequest.applicant.id,
            },
          },
          organization: {
            connect: {
              id: organization.id,
            },
          },
          role: 'doctor',
          attached_types: {
            create: attached_types.map((id) => ({
              type: {
                connect: {
                  id: id,
                },
              },
            })),
          },
        },
        include: {
          worker: true,
          attached_types: {
            include: {
              type: true,
            },
          },
        },
      });

      return new_worker;
    } else {
      const new_worker = await this.prisma.worker.create({
        data: {
          worker: {
            connect: {
              id: joinRequest.applicant.id,
            },
          },
          organization: {
            connect: {
              id: organization.id,
            },
          },
          role: 'receptionist',
        },
        include: {
          worker: true,
          attached_types: {
            include: {
              type: true,
            },
          },
        },
      });

      return new_worker;
    }
  }

  async getWorkers(req: RequestWithUser, org_id: number) {
    const user = req.user;
    const workers = await this.prisma.worker.findMany({
      where: { organization_id: org_id, organization: { owner_id: user.id } },
      include: {
        worker: true,
        attached_types: {
          include: {
            type: true,
          },
        },
      },
    });
    if (!workers) {
      throw new HttpException('Ichki server xatosi', 404);
    }
    return workers;
  }

  async getAWorker(
    req: RequestWithUser,
    params: { org_id: number; id: number },
  ) {
    const user = req.user;
    const worker = await this.prisma.worker.findUnique({
      where: {
        id: params.id,
        organization_id: params.org_id,
        organization: { owner_id: user.id },
      },
      include: {
        worker: true,
        attached_types: {
          include: {
            type: true,
          },
        },
      },
    });
    if (!worker) {
      throw new HttpException('Ichki server xatosi', 404);
    }
    return worker;
  }

  async updateWorker(
    req: RequestWithUser,
    params: { org_id: number; id: number },
    data: UpdateWorkerDto,
  ) {
    const user = req.user;

    const organization = await this.prisma.organization.findUnique({
      where: { owner_id: user.id, id: params.org_id },
      include: {
        workers: true,
      },
    });

    if (!organization) {
      throw new HttpException('Siz ushbu tashkilotga ega emassiz', 404);
    }

    const existing_worker = organization.workers.find(
      (w) => w.id === params.id,
    );

    if (!existing_worker) {
      throw new HttpException("Sizning tashkilotingizda bu ishchi yo'q", 404);
    }

    const { attached_types, role } = data;

    const updateData: any = {};
    if (role) {
      updateData.role = role;

      if (role === 'doctor') {
        if (attached_types) {
          updateData.attached_types = {
            deleteMany: {}, // clear old
            create: attached_types.map((id) => ({
              type: { connect: { id } },
            })),
          };
        }
      } else {
        // any non-doctor role → remove all types
        updateData.attached_types = { deleteMany: {} };
      }
    }

    const updated_worker = await this.prisma.worker.update({
      where: {
        id: existing_worker.id,
      },
      data: updateData,
      include: {
        worker: true,
        attached_types: {
          include: {
            type: true,
          },
        },
      },
    });

    return updated_worker;
  }

  async deleteAWorker(
    req: RequestWithUser,
    params: { org_id: number; id: number },
  ) {
    const user = req.user;
    await this.prisma.worker.delete({
      where: {
        id: params.id,
        organization_id: params.org_id,
        organization: { owner_id: user.id },
      },
    });
    return { deleted: true };
  }
}
