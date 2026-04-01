import { HttpException, Injectable } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { isAfter, isBefore } from 'date-fns';

@Injectable()
export class SubscriptionCheckerService {
  track(org: Organization) {
    if (org.is_vip) {
      return true;
    }

    const now = new Date();

    const is_subscribed =
      org.subscription_status === 'active' &&
      isBefore(org.subscribed_at, now) &&
      isAfter(org.renews_at, now);

    if (!is_subscribed) {
      throw new HttpException("Tashkilot obuna bo'lmagan", 407);
    }

    return is_subscribed;
  }
}
