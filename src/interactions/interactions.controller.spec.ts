import { Test, TestingModule } from '@nestjs/testing';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { InteractionAction } from './domain/interaction';

describe('InteractionsController', () => {
  let controller: InteractionsController;
  let service: jest.Mocked<InteractionsService>;

  const mockInteraction = {
    id: 'int-1',
    fromUser: 'user-a',
    toUser: 'user-b',
    action: InteractionAction.like,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteractionsController],
      providers: [
        {
          provide: InteractionsService,
          useValue: {
            create: jest.fn(),
            findLikesReceived: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InteractionsController);
    service = module.get(InteractionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should pass user id from request to service', async () => {
      const request = { user: { id: 'user-a' } };
      const dto = {
        toUserId: 'user-b',
        action: InteractionAction.like,
      };
      service.create.mockResolvedValue(mockInteraction);

      const result = await controller.create(request, dto);

      expect(service.create).toHaveBeenCalledWith('user-a', dto);
      expect(result).toEqual(mockInteraction);
    });
  });

  describe('likesReceived', () => {
    it('should return likes with default pagination', async () => {
      const request = { user: { id: 'user-a' } };
      service.findLikesReceived.mockResolvedValue([mockInteraction]);

      const result = await controller.likesReceived(request, {});

      expect(service.findLikesReceived).toHaveBeenCalledWith('user-a', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual([mockInteraction]);
    });

    it('should respect custom pagination', async () => {
      const request = { user: { id: 'user-a' } };
      service.findLikesReceived.mockResolvedValue([]);

      await controller.likesReceived(request, { page: 2, limit: 10 });

      expect(service.findLikesReceived).toHaveBeenCalledWith('user-a', {
        page: 2,
        limit: 10,
      });
    });

    it('should cap limit at 50', async () => {
      const request = { user: { id: 'user-a' } };
      service.findLikesReceived.mockResolvedValue([]);

      await controller.likesReceived(request, { page: 1, limit: 100 });

      expect(service.findLikesReceived).toHaveBeenCalledWith('user-a', {
        page: 1,
        limit: 50,
      });
    });
  });
});
