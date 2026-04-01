import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { SubscriptionCheckerService } from 'src/global/subscription_checker/subscription_checker.service';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sub_checker: SubscriptionCheckerService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: RequestWithUser = context.switchToHttp().getRequest();
    const user = req.user;
    const unique_name = req.params.unique_name;
    const org_id = req.params.org_id;

    if (!user || (!org_id && !unique_name)) {
      throw new HttpException('Ruxsatsiz', 401);
    }

    const where = unique_name ? { unique_name } : { id: Number(org_id) };

    const organization = await this.prisma.organization.findUnique({
      where,
      include: {
        workers: {
          select: {
            worker_id: true,
            role: true,
            attached_types: {
              select: {
                type: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new HttpException('Tashkilot topilmadi', 404);
    }

    // checking for subscription
    this.sub_checker.track(organization);

    // flatten attached_types
    const transformed = {
      ...organization,
      workers: organization.workers.map((worker) => ({
        ...worker,
        attached_types: worker.attached_types.map((a) => ({ id: a.type.id })),
      })),
    };

    const isOwner = transformed.owner_id === user.id;
    const isWorker = transformed.workers.some((w) => w.worker_id === user.id);
    const worker = transformed.workers.find((w) => w.worker_id === user.id);

    if (!isOwner && !isWorker) {
      throw new HttpException('Taqiqlangan', 403);
    }

    if (worker) {
      req.worker = worker;
    }
    req.organization = organization;

    return true;
  }
}
