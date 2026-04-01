import { HttpException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateUsernameService } from 'src/global/generate_username/generate_username.service';
import { LoginDto } from './dtos/login.dto';
import { RequestWithUser } from 'src/interfaces/request-with-user.interface';
import { Response } from 'express';
import { AccessTokenService } from 'src/global/access_token/access_token.service';
import { ResetTokenService } from 'src/global/reset_token/reset_token.service';
import { VerifyMailService } from 'src/mailers/verify_mail/verify_mail.service';
import { MagicLinkGeneratorService } from 'src/global/magic_link_generator/magic_link_generator.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private unique_username: GenerateUsernameService,
    private access_token: AccessTokenService,
    private reset_token: ResetTokenService,
    private verify_mail: VerifyMailService,
    private magic_link: MagicLinkGeneratorService,
  ) {}

  async registerUser(data: RegisterDto) {
    // recieving data
    const present_user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (present_user && present_user.provider === 'email') {
      throw new HttpException(
        `Ushbu email bilan ro'yxatdan o'tgan foydalanuvchi mavjud, iltimos tizimga kiring`,
        404,
      );
    }
    if (present_user && present_user.provider !== 'email') {
      throw new HttpException(
        `${present_user.email} ning provayderi ${present_user.provider}, iltimos ro'yxatdan o'tish uchun ${present_user.provider} dan foydalaning`,
        404,
      );
    }

    // formating
    const username = await this.unique_username.generate(data.name);
    const verify_token = this.jwt.sign(
      {
        username: username,
        name: data.name,
        email: data.email,
        method: 'signup',
      },
      { expiresIn: '15m' },
    );
    const magic_link = this.magic_link.generate(verify_token);

    // sending mail
    await this.verify_mail.send(data.email, data.name, magic_link);
    return {
      message: `Magic link send to ${data.email}`,
      ok: true,
    };
  }

  async loginUser(data: LoginDto) {
    // checking
    const the_user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // error handling
    if (!the_user) {
      throw new HttpException('Foydalanuvchi topilmadi', 404);
    }
    if (the_user.provider !== 'email') {
      throw new HttpException(
        `${the_user.email} ning provayderi ${the_user.provider}, iltimos ro'yxatdan o'tish uchun ${the_user.provider} dan foydalaning`,
        404,
      );
    }

    // generating token
    const verify_token = this.jwt.sign(
      {
        email: the_user.email,
        method: 'signin',
      },
      { expiresIn: '15m' },
    );
    const magic_link = this.magic_link.generate(verify_token);
    // sending mail
    await this.verify_mail.send(data.email, "Foydalanuvchi", magic_link);

    return {
      message: `welcome back, Magic link send to ${data.email}`,
      ok: true,
    };
  }

  async verifyMagicLink(token: string) {
    const data = this.jwt.verify(token);
    if (data.method == 'signup') {
      const userdata = {
        name: data.name,
        username: data.username,
        email: data.email,
        provider: 'email',
      };
      const new_user = await this.prisma.user.create({ data: userdata });
      if (!new_user) {
        throw new HttpException("Serverda xatolik, birozdan so'ng urinib ko'ring", 400);
      }
      const access_token = this.access_token.generate(new_user);
      const reset_token = this.reset_token.generate(new_user);
      return {
        access_token: access_token,
        reset_token: reset_token,
      };
    } else if (data.method == 'signin') {
      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (!user) {
        throw new HttpException('Foydalanuvchi topilmadi', 404);
      }
      const access_token = this.access_token.generate(user);
      const reset_token = this.reset_token.generate(user);
      return {
        access_token: access_token,
        reset_token: reset_token,
      };
    } else {
      throw new HttpException('Yaroqsiz token', 404);
    }
  }

  async getUserProfile(req: RequestWithUser) {
    const userdata = await this.prisma.user.findUnique({
      where: { id: req.user.id, email: req.user.email },
      include: {
        _count: {
          select: {
            organizations: true,
          },
        },
        default_organization: {
          include: {
            organization: {
              include: {
                banner: true,
              },
            },
          },
        },
      },
    });
    if (!userdata) {
      throw new HttpException('Foydalanuvchi topilmadi', 404);
    }
    return userdata;
  }

  async githubHandler(req: RequestWithUser, res: Response) {
    const github_user_data = req.user;

    const existing_user = await this.prisma.user.findFirst({
      where: { provider_id: github_user_data.provider_id, provider: 'github' },
    });
    const existing_email = await this.prisma.user.findFirst({
      where: { email: github_user_data.email },
    });

    if (!existing_user && existing_email) {
      const error_message = `${existing_email.email} ning provayderi ${existing_email.provider}, iltimos ro'yxatdan o'tish uchun ${existing_email.provider} dan foydalaning`;
      return res.redirect(
        `${process.env.FRONT_ORIGIN}/signin/?error=${error_message}`,
      );
    }

    if (!existing_user) {
      const u_username = await this.unique_username.generate(
        github_user_data.username,
      );
      const new_user = await this.prisma.user.create({
        data: {
          name: github_user_data.name,
          username: u_username,
          email: github_user_data.email,
          provider_id: github_user_data.provider_id,
          avatar: github_user_data.avatar,
          provider: github_user_data.provider,
        },
      });
      const verify_token = this.jwt.sign(
        {
          email: new_user.email,
          method: 'signin',
        },
        { expiresIn: '15m' },
      );
      const magic_link = this.magic_link.generate(verify_token);

      res.redirect(magic_link);
    } else {
      const verify_token = this.jwt.sign(
        {
          email: existing_user.email,
          method: 'signin',
        },
        { expiresIn: '15m' },
      );
      const magic_link = this.magic_link.generate(verify_token);
      res.redirect(magic_link);
    }
  }

  async googleHandler(req: RequestWithUser, res: Response) {
    const google_user_data = req.user;

    const existing_user = await this.prisma.user.findFirst({
      where: { provider_id: google_user_data.provider_id, provider: 'google' },
    });
    const existing_email = await this.prisma.user.findFirst({
      where: { email: google_user_data.email },
    });

    if (!existing_user && existing_email) {
      const error_message = `${existing_email.email} ning provayderi ${existing_email.provider}, iltimos ro'yxatdan o'tish uchun ${existing_email.provider} dan foydalaning`;
      return res.redirect(
        `${process.env.FRONT_ORIGIN}/signin/?error=${error_message}`,
      );
    }

    if (!existing_user) {
      const u_username = await this.unique_username.generate(
        google_user_data.name,
      );
      const new_user = await this.prisma.user.create({
        data: {
          name: google_user_data.name,
          username: u_username,
          email: google_user_data.email,
          provider_id: google_user_data.provider_id,
          avatar: google_user_data.avatar,
          provider: google_user_data.provider,
        },
      });
      const verify_token = this.jwt.sign(
        {
          email: new_user.email,
          method: 'signin',
        },
        { expiresIn: '15m' },
      );
      const magic_link = this.magic_link.generate(verify_token);

      res.redirect(magic_link);
    } else {
      const verify_token = this.jwt.sign(
        {
          email: existing_user.email,
          method: 'signin',
        },
        { expiresIn: '15m' },
      );
      const magic_link = this.magic_link.generate(verify_token);
      res.redirect(magic_link);
    }
  }

  async ResetToken(token: string) {
    const payload = this.jwt.verify(token);
    if (payload.action !== 'reset' || !payload.email) {
      return new HttpException('Yaroqsiz tiklash tokeni', 404);
    }
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      throw new HttpException('Foydalanuvchi topilmadi', 404);
    }
    return this.access_token.generate(user);
  }
}
