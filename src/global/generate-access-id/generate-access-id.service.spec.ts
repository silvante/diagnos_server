import { Test, TestingModule } from '@nestjs/testing';
import { GenerateAccessIdService } from './generate-access-id.service';

describe('GenerateAccessIdService', () => {
  let service: GenerateAccessIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateAccessIdService],
    }).compile();

    service = module.get<GenerateAccessIdService>(GenerateAccessIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
