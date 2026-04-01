import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(password: string) {
    const ap = process.env.ADMIN_PASSWORD;
    const secret = String(ap);

    // comparing
    if (password !== secret) {
      throw new HttpException("parol noto'g'ri :(", 404);
    }

    const access_token = this.jwt.sign({ admin_access: true });
    return {
      permission: true,
      token: access_token,
    };
  }

  async ls_org(unique_name: string) {
    return await this.prisma.organization.findUnique({
      where: { unique_name },
      select: {
        id: true,
        name: true,
        unique_name: true,
        description: true,
        origin: true,
        is_vip: true,
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
  }

  async mkvip(unique_name: string) {
    const updated = await this.prisma.organization.update({
      where: { unique_name },
      data: {
        is_vip: true,
      },
    });

    return {
      message: `organization with unique name '${updated.unique_name}' is VIP now!`,
    };
  }
}
