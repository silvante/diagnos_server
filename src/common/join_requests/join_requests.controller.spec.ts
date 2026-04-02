import { Test, TestingModule } from '@nestjs/testing';
import { JoinRequestsController } from './join_requests.controller';

describe('JoinRequestsController', () => {
  let controller: JoinRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JoinRequestsController],
    }).compile();

    controller = module.get<JoinRequestsController>(JoinRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
