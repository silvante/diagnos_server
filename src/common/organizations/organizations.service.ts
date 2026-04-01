import { HttpException, Injectable } from '@nestjs/common';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationDto } from './dtos/create_organization.dto';
import { GenerateUniquenameService } from 'src/global/generate_uniquename/generate_uniquename.service';
import { ValidateOrganizationDto } from './dtos/validate.dto';
import * as bcrypt from 'bcrypt';
import { SALT_RESULT } from 'src/constants';
import { UpdateOrganizationDto } from './dtos/update_organization.dto';
import { UpdatePincodeDto } from './dtos/update_pincode.dto';
import { Organization } from '@prisma/client';
import { SubscriptionCheckerService } from 'src/global/subscription_checker/subscription_checker.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uniquename: GenerateUniquenameService,
    private readonly sub_checker: SubscriptionCheckerService,
  ) {}

  async getOrganizations(req: RequestWithUser) {
    const user = req.user;
    const organizations = await this.prisma.organization.findMany({
      where: { owner_id: user.id },
      include: {
        banner: true,
      },
    });
    return organizations;
  }

  async createOrganization(req: RequestWithUser, data: CreateOrganizationDto) {
    const user = req.user;
    const { pincode, banner, ...form_data } = data;

    if (pincode.length === 6) {
      throw new HttpException("Pinkod 6 xonali son bo'lishi kerak.", 404);
    }

    const hashed_pincode = bcrypt.hashSync(pincode, SALT_RESULT);
    const unique_name = await this.uniquename.generate(data.name);

    // renews at
    const now = new Date();
    const renews_at = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const new_organization = await this.prisma.organization.create({
      data: {
        ...form_data,
        unique_name,
        pincode: hashed_pincode,
        owner: {
          connect: {
            id: user.id,
          },
        },
        ...(banner && {
          banner: {
            create: {
              original: banner.original,
              thumbnail: banner.thumbnail,
            },
          },
        }),
        // giving users +2week free trial
        renews_at,
        subscription_status: 'active',
      },
      include: {
        banner: true,
        owner: {
          include: {
            default_organization: true,
          },
        },
      },
    });
    if (!new_organization) {
      throw new Error('Failed to create organization');
    }

    if (!new_organization.owner.default_organization) {
      await this.MakeDefault(req, new_organization.unique_name);
    }

    return new_organization;
  }

  async getOrganizationByUniqueName(req: RequestWithUser) {
    const organization = req.organization;
    return organization;
  }

  async ValidateOrganization(
    req: RequestWithUser,
    unique_name: string,
    data: ValidateOrganizationDto,
  ) {
    const user = req.user;
    const organization = await this.prisma.organization.findUnique({
      where: { unique_name: unique_name, owner_id: user.id },
      include: {
        banner: true,
        _count: {
          select: {
            workers: true,
            types: true,
            clients: true,
          },
        },
      },
    });

    if (!organization) {
      throw new HttpException('You do not own this organization', 404);
    }

    // checking for subscription
    this.sub_checker.track(organization);

    const is_pincode_valid = bcrypt.compareSync(
      data.pincode,
      organization.pincode,
    );

    if (!is_pincode_valid) {
      throw new HttpException('Invalid pincode', 400);
    }

    return { validation: true, organization: organization };
  }

  async EditOrganization(
    req: RequestWithUser,
    unique_name: string,
    data: UpdateOrganizationDto,
  ) {
    const user = req.user;

    const { banner, ...updateData } = data;
    const updated_organization = await this.prisma.organization.update({
      where: { unique_name: unique_name, owner_id: user.id },
      data: {
        ...updateData,
        ...(banner && {
          banner: {
            upsert: {
              update: {
                original: banner.original,
                thumbnail: banner.thumbnail,
              },
              create: {
                original: banner.original,
                thumbnail: banner.thumbnail,
              },
            },
          },
        }),
      },
      include: {
        banner: true,
      },
    });

    if (!updated_organization) {
      throw new HttpException(
        'You do not own this organization or internal server error',
        404,
      );
    }

    return updated_organization;
  }

  async updatePincode(
    req: RequestWithUser,
    unique_name: string,
    data: UpdatePincodeDto,
  ) {
    const user = req.user;

    if (data.old_pincode.length !== 6 || data.new_pincode.length !== 6) {
      throw new HttpException(
        "Pinkodlar 6 xonali sondan iborat bol'ishi kerak.",
        404,
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { unique_name: unique_name, owner_id: user.id },
    });
    if (!org) {
      throw new HttpException('You do not own this organization', 404);
    }
    const is_pin_ok = bcrypt.compareSync(data.old_pincode, org.pincode);
    if (!is_pin_ok) {
      throw new HttpException('invalide pincode', 404);
    }
    if (data.new_pincode !== data.pincode_confirmation) {
      throw new HttpException('pincode confirmation should match', 404);
    }
    const updated = await this.prisma.organization.update({
      where: { id: org.id },
      data: { pincode: bcrypt.hashSync(data.new_pincode, SALT_RESULT) },
      include: {
        banner: true,
      },
    });
    if (!updated) {
      throw new HttpException('internal server error', 404);
    }
    return updated;
  }

  async deleteOrganization(req: RequestWithUser, unique_name: string) {
    const user = req.user;
    const org = await this.prisma.organization.findUnique({
      where: { unique_name: unique_name, owner_id: user.id },
      include: {
        _count: {
          select: {
            types: true,
            clients: true,
          },
        },
      },
    });
    if (!org) {
      throw new HttpException('You do not own this organization', 404);
    }
    if (org._count.clients > 0 || org._count.types > 0) {
      throw new HttpException(
        'this organization has data attached to it, you can not delete this organization',
        404,
      );
    }
    await this.prisma.organization.delete({ where: { id: org.id } });
    return { deleted: true };
  }

  async MakeDefault(req: RequestWithUser, unique_name: string) {
    const user = req.user;
    let org: Organization | null;

    if (!req.organization) {
      org = await this.prisma.organization.findUnique({
        where: { unique_name: unique_name },
      });
    } else {
      org = req.organization;
    }

    const exisiting_DO = await this.prisma.defaultOrganization.findUnique({
      where: { owner_id: user.id },
    });

    if (!org) {
      throw new HttpException('you do not own this organization', 404);
    }

    if (exisiting_DO) {
      await this.prisma.defaultOrganization.update({
        where: { id: exisiting_DO.id },
        data: {
          organization: {
            connect: {
              id: org.id,
            },
          },
        },
      });
    } else {
      await this.prisma.defaultOrganization.create({
        data: {
          owner: {
            connect: {
              id: user.id,
            },
          },
          organization: {
            connect: {
              id: org.id,
            },
          },
        },
      });
    }

    return {
      success: true,
    };
  }
}
