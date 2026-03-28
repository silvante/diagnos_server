import { HttpException, Injectable } from '@nestjs/common';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkerRoles } from '@prisma/client';
import { GenerateAccessIdService } from 'src/global/generate-access-id/generate-access-id.service';

@Injectable()
export class VacancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly a_id: GenerateAccessIdService,
  ) {}

  async create(req: RequestWithUser, data: CreateVacancyDto) {
    const user = req.user;
    const new_vacancy = await this.prisma.vacancy.create({
      data: {
        ...data,
        user: {
          connect: {
            id: user.id,
          },
        },
        a_id: this.a_id.generate(),
      },
      include: {
        user: true,
      },
    });
    if (!new_vacancy) {
      throw new HttpException('Internal server error', 404);
    }
    return new_vacancy;
  }

  async findMyAll(req: RequestWithUser) {
    const user = req.user;
    const vacancies = await this.prisma.vacancy.findMany({
      where: { user_id: user.id },
      include: {
        user: true,
      },
    });
    if (!vacancies) {
      throw new HttpException('Internal server error', 404);
    }
    return vacancies;
  }

  async findOne(id: number) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id: id, is_private: false },
      include: {
        user: true,
      },
    });
    if (!vacancy) {
      throw new HttpException('Vacancy not found', 404);
    }
    return vacancy;
  }

  async update(req: RequestWithUser, id: number, data: UpdateVacancyDto) {
    const user = req.user;
    const vacancy = await this.prisma.vacancy.update({
      where: { id: id, user_id: user.id },
      data: {
        ...data,
      },
      include: {
        user: true,
      },
    });
    if (!vacancy) {
      throw new HttpException(
        'Vacancy not found or You do not own this vacancy',
        404,
      );
    }
    return vacancy;
  }

  async remove(req: RequestWithUser, id: number) {
    const user = req.user;
    const deleting_obj = await this.prisma.vacancy.delete({
      where: { id: id, user_id: user.id },
    });
    if (!deleting_obj) {
      throw new HttpException(
        'Vacancy not found or You do not own this vacancy',
        404,
      );
    }
    return {
      deleted: true,
    };
  }

  async search(
    origin: string,
    query: string,
    role: WorkerRoles | null,
    job: string | null,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.vacancy.findMany({
        where: {
          origin: origin,
          is_private: false,
          name: {
            contains: query,
            mode: 'insensitive',
          },
          ...(role && { role: role }),
          ...(job && {
            job: {
              contains: job,
              mode: 'insensitive',
            },
          }),
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
        },
      }),
      this.prisma.vacancy.count({
        where: {
          origin: origin,
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total: total,
        page: page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async getByAccessID(a_id: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { a_id: a_id },
    });
    return vacancy;
  }
}
