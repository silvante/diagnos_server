import { HttpException, Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { startOfDay, endOfDay } from 'date-fns';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientParamsDto } from './dto/search-clients.dto';
import * as dayjs from 'dayjs';
import { ClientsGateway } from './clients.gateway';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client_gateway: ClientsGateway,
  ) {}

  async create(req: RequestWithUser, data: CreateClientDto) {
    const organization = req.organization;
    const user = req.user;

    const { type_ids, ...clientData } = data;
    if (!type_ids || type_ids.length <= 0) {
      throw new HttpException(
        "1ta yoki undan ko'p turlar tanlanishi kerak!",
        404,
      );
    }
    const client = await this.prisma.client.create({
      data: {
        ...clientData,

        organization: {
          connect: {
            id: organization.id,
          },
        },
        diagnoses: {
          create: type_ids.map((id) => ({
            type: {
              connect: {
                id: id,
              },
            },
          })),
        },
      },
      include: {
        diagnoses: {
          include: {
            type: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // realtime: Create Event
    this.client_gateway.sendNewClient(String(organization.id), client, user.id);

    return client;
  }

  async findTodayClients(req: RequestWithUser) {
    const organization = req.organization;
    const worker = req.worker;

    const day_start = startOfDay(new Date());
    const day_end = endOfDay(new Date());

    let where: any = {};
    let include: any = {};

    if (worker && worker.role === 'doctor') {
      const typeIds = worker.attached_types.map((at) => at.id);
      where = {
        organization_id: organization.id,
        created_at: {
          gte: day_start,
          lte: day_end,
        },
        diagnoses: {
          some: {
            type_id: { in: typeIds },
          },
        },
      };

      include = {
        diagnoses: {
          where: {
            type_id: { in: typeIds },
          },
          include: {
            type: {
              select: {
                name: true,
              },
            },
          },
        },
      };
    } else {
      where = {
        organization_id: organization.id,
        created_at: {
          gte: day_start,
          lte: day_end,
        },
      };

      include = {
        diagnoses: {
          include: {
            type: {
              select: {
                name: true,
              },
            },
          },
        },
      };
    }

    const clients = await this.prisma.client.findMany({
      where: where,
      include: include,
    });

    if (!clients) {
      throw new HttpException("Serverda xatolik, birozdan so'ng urinib ko'ring", 404);
    }
    if (worker && worker.role === 'doctor') {
      return {
        clients: clients,
      };
    } else {
      const types = await this.prisma.type.findMany({
        where: { organization_id: organization.id },
        include: {
          _count: {
            select: {
              diagnoses: true,
              attached_workers: true,
            },
          },
        },
      });
      return {
        clients: clients,
        types: types,
      };
    }
  }

  async checkClient(
    req: RequestWithUser,
    report: string,
    client_id: number,
    diagnosis_id: number,
  ) {
    const org = req.organization;
    const worker = req.worker;
    const user = req.user;

    let where: any = {};
    if (worker && worker.role === 'doctor') {
      const typeIds = worker.attached_types.map((at) => at.id);

      where = {
        id: diagnosis_id,
        client_id: client_id,
        type_id: {
          in: typeIds,
        },
        is_checked: false,
      };
    } else {
      where = { id: diagnosis_id, client_id: client_id };
    }

    const updated_diagnosis = await this.prisma.diagnosis.update({
      where: where,
      data: {
        is_checked: true,
        report: report,
        reporter_name: user.name,
        reporter: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        client: {
          include: {
            diagnoses: {
              include: {
                type: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let client = updated_diagnosis.client;

    const to_update = client.diagnoses.find((d) => d.is_checked !== true);

    if (!to_update) {
      client = await this.prisma.client.update({
        where: { id: client.id },
        data: { is_checked: true },
        include: {
          diagnoses: {
            include: {
              type: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    if (!updated_diagnosis) {
      throw new HttpException('Ichki server xatosi', 404);
    }

    // realime: Update event
    this.client_gateway.sendUpdatedClient(String(org.id), client, user.id);

    if (worker && worker.role === 'doctor') {
      const typeIds = worker.attached_types.map((at) => at.id);
      let diagnoses = client.diagnoses.filter((d) =>
        typeIds.includes(d.type_id),
      );
      client.diagnoses = diagnoses;
    }

    return {
      checked: true,
      client: client,
    };
  }

  async updateClient(
    req: RequestWithUser,
    client_id: number,
    data: UpdateClientDto,
  ) {
    const organization = req.organization;
    const user = req.user;
    const client = await this.prisma.client.findUnique({
      where: { id: client_id, organization_id: organization.id },
      include: {
        organization: true,
        diagnoses: true,
      },
    });

    if (!client) {
      throw new HttpException(
        'bu tashkilot ushbu mijozga ega emas yoki serverda xatolik',
        404,
      );
    }

    if (client.is_checked) {
      throw new HttpException(
        "Agar mijoz allaqachon tekshirilgan bo'lsa, uni yangilay olmaysiz",
        404,
      );
    }

    const { type_ids, ...updateData } = data;
    if (!type_ids || type_ids.length <= 0) {
      throw new HttpException(
        "1ta yoki undan ko'p turlar tanlanishi kerak!",
        404,
      );
    }

    // Handling deleable and undeleteable Diagnosis
    const existing_diagnosis = client.diagnoses;
    const deletable = existing_diagnosis
      .filter((d) => !d.is_checked && !type_ids?.includes(d.type_id))
      .map((d) => d.id);

    const existing_type_ids = existing_diagnosis.map((d) => d.type_id);
    const to_create = type_ids?.filter((id) => !existing_type_ids.includes(id));

    let updated = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        ...updateData,
        diagnoses: {
          deleteMany: {
            id: { in: deletable },
          },
          create: to_create?.map((t_id) => ({
            type: {
              connect: {
                id: t_id,
              },
            },
          })),
        },
      },
      include: {
        diagnoses: {
          include: {
            type: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const to_update = updated.diagnoses.find((d) => d.is_checked !== true);

    if (!to_update) {
      updated = await this.prisma.client.update({
        where: { id: client.id },
        data: { is_checked: true },
        include: {
          diagnoses: {
            include: {
              type: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    // realtime: Update event
    this.client_gateway.sendUpdatedClient(
      String(organization.id),
      updated,
      user.id,
    );

    return updated;
  }

  async DeleteClients(req: RequestWithUser, client_id: number) {
    const organization = req.organization;
    const client = await this.prisma.client.findUnique({
      where: { id: client_id, organization_id: organization.id },
      include: {
        organization: true,
        diagnoses: {
          include: {
            type: true,
          },
        },
      },
    });
    const user = req.user;

    if (!client) {
      throw new HttpException(
        'bu tashkilot ushbu mijozga ega emas yoki serverda xatolik',
        404,
      );
    }

    if (client.is_checked) {
      throw new HttpException(
        "Agar mijoz allaqachon tekshirilgan bo'lsa, uni o'chira olmaysiz",
        404,
      );
    }

    await this.prisma.client.delete({ where: { id: client.id } });

    // realtime: Delete event
    this.client_gateway.sendDeletedClient(
      String(organization.id),
      client,
      user.id,
    );

    return {
      deleted: true,
    };
  }

  async searchClients(req: RequestWithUser, query: SearchClientParamsDto) {
    const org = req.organization;
    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          organization_id: org.id,
          is_checked: true,
          name: {
            contains: query.name,
            mode: 'insensitive',
          },
          surname: {
            contains: query.surname,
            mode: 'insensitive',
          },
          ...(query.born_in && { born_in: query.born_in }),
          ...(query.type_id && {
            diagnoses: { some: { type_id: query.type_id } },
          }),
        },
        skip,
        take: query.limit,
        orderBy: { created_at: 'desc' },
        include: {
          diagnoses: {
            include: {
              type: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.client.count({
        where: {
          organization_id: org.id,
          is_checked: true,
          name: {
            contains: query.name,
            mode: 'insensitive',
          },
          surname: {
            contains: query.surname,
            mode: 'insensitive',
          },
          ...(query.born_in && { born_in: query.born_in }),
          ...(query.type_id && {
            diagnoses: { some: { type_id: query.type_id } },
          }),
        },
      }),
    ]);

    return {
      data,
      meta: {
        total: total,
        page: query.page,
        last_page: Math.ceil(total / query.limit),
      },
    };
  }

  async getClientsByDate(
    req: RequestWithUser,
    date: string,
    query: { page: number; limit: number },
  ) {
    const org = req.organization;
    const skip = (query.page - 1) * query.limit;

    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).endOf('day').toDate();

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          organization_id: org.id,
          created_at: {
            gte: start,
            lte: end,
          },
        },
        skip,
        take: query.limit,
        include: {
          diagnoses: {
            include: {
              type: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.client.count({
        where: {
          organization_id: org.id,
          created_at: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total: total,
        page: query.page,
        last_page: Math.ceil(total / query.limit),
      },
    };
  }
}
