import { Injectable } from '@nestjs/common';
import { GenerateAccessIdService } from './global/generate-access-id/generate-access-id.service';

@Injectable()
export class AppService {
  constructor(private readonly a_id: GenerateAccessIdService) {}

  getHello(): string {
    return `ramdon id: ${this.a_id.generate()}`;
  }
}
