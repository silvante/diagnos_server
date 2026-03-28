import { Module } from '@nestjs/common';
import { GenerateUsernameService } from './generate_username/generate_username.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SocialAuthResponceService } from './social_auth_responce/social_auth_responce.service';
import { ResetTokenService } from './reset_token/reset_token.service';
import { AccessTokenService } from './access_token/access_token.service';
import { AppJwtModule } from 'src/jwt/jwt.module';
import { GenerateUniquenameService } from './generate_uniquename/generate_uniquename.service';
import { NameSanitizerService } from './name_sanitizer/name_sanitizer.service';
import { SubscriptionCheckerService } from './subscription_checker/subscription_checker.service';
import { MagicLinkGeneratorService } from './magic_link_generator/magic_link_generator.service';
import { GenerateAccessIdService } from './generate-access-id/generate-access-id.service';

@Module({
  imports: [PrismaModule, AppJwtModule],
  providers: [
    GenerateUsernameService,
    SocialAuthResponceService,
    ResetTokenService,
    AccessTokenService,
    GenerateUniquenameService,
    NameSanitizerService,
    SubscriptionCheckerService,
    MagicLinkGeneratorService,
    GenerateAccessIdService,
  ],
  exports: [
    GenerateUsernameService,
    SocialAuthResponceService,
    ResetTokenService,
    AccessTokenService,
    GenerateUniquenameService,
    NameSanitizerService,
    SubscriptionCheckerService,
    MagicLinkGeneratorService,
  ],
})
export class GlobalModule {}
