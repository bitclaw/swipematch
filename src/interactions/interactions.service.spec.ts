import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionRepository } from './infrastructure/persistence/interaction.repository';
import { MatchesService } from '../matches/matches.service';
import { InteractionAction } from './domain/interaction';

describe('InteractionsService', () => {
  let service: InteractionsService;
  let interactionRepo: jest.Mocked<InteractionRepository>;
  let matchesService: jest.Mocked<MatchesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionsService,
        {
          provide: InteractionRepository,
          useValue: {
            create: jest.fn(),
            findByFromUserAndToUser: jest.fn(),
            findLikesReceived: jest.fn(),
            findByFromUser: jest.fn(),
            findById: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: MatchesService,
          useValue: {
            createMatch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(InteractionsService);
    interactionRepo = module.get(InteractionRepository);
    matchesService = module.get(MatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const fromUserId = 'user-a';
    const toUserId = 'user-b';

    it('should create an interaction', async () => {
      const dto = { toUserId, action: InteractionAction.like };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser.mockResolvedValue(null);
      interactionRepo.create.mockResolvedValue(created);

      const result = await service.create(fromUserId, dto);

      expect(result).toEqual(created);
      expect(interactionRepo.create).toHaveBeenCalledWith({
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
      });
    });

    it('should throw when interacting with self', async () => {
      const dto = { toUserId: fromUserId, action: InteractionAction.like };

      await expect(service.create(fromUserId, dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(interactionRepo.create).not.toHaveBeenCalled();
    });

    it('should throw on duplicate interaction', async () => {
      const dto = { toUserId, action: InteractionAction.like };
      interactionRepo.findByFromUserAndToUser.mockResolvedValue({
        id: 'existing',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.create(fromUserId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create a match when mutual like is detected', async () => {
      const dto = { toUserId, action: InteractionAction.like };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'int-reverse',
          fromUser: toUserId,
          toUser: fromUserId,
          action: InteractionAction.like,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      interactionRepo.create.mockResolvedValue(created);

      await service.create(fromUserId, dto);

      expect(matchesService.createMatch).toHaveBeenCalledWith(
        fromUserId,
        toUserId,
      );
    });

    it('should create a match on superlike + like combo', async () => {
      const dto = { toUserId, action: InteractionAction.superlike };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.superlike,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'int-reverse',
          fromUser: toUserId,
          toUser: fromUserId,
          action: InteractionAction.like,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      interactionRepo.create.mockResolvedValue(created);

      await service.create(fromUserId, dto);

      expect(matchesService.createMatch).toHaveBeenCalledWith(
        fromUserId,
        toUserId,
      );
    });

    it('should NOT create a match for a pass action', async () => {
      const dto = { toUserId, action: InteractionAction.pass };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.pass,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser.mockResolvedValue(null);
      interactionRepo.create.mockResolvedValue(created);

      await service.create(fromUserId, dto);

      expect(matchesService.createMatch).not.toHaveBeenCalled();
    });

    it('should NOT create a match when reverse is a pass', async () => {
      const dto = { toUserId, action: InteractionAction.like };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'int-reverse',
          fromUser: toUserId,
          toUser: fromUserId,
          action: InteractionAction.pass,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      interactionRepo.create.mockResolvedValue(created);

      await service.create(fromUserId, dto);

      expect(matchesService.createMatch).not.toHaveBeenCalled();
    });

    it('should NOT create a match when no reverse interaction exists', async () => {
      const dto = { toUserId, action: InteractionAction.like };
      const created = {
        id: 'int-1',
        fromUser: fromUserId,
        toUser: toUserId,
        action: InteractionAction.like,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      interactionRepo.findByFromUserAndToUser
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      interactionRepo.create.mockResolvedValue(created);

      await service.create(fromUserId, dto);

      expect(matchesService.createMatch).not.toHaveBeenCalled();
    });
  });

  describe('findLikesReceived', () => {
    it('should delegate to repository with pagination', async () => {
      const likes = [
        {
          id: 'int-1',
          fromUser: 'user-b',
          toUser: 'user-a',
          action: InteractionAction.like,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      interactionRepo.findLikesReceived.mockResolvedValue(likes);

      const result = await service.findLikesReceived('user-a', {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(likes);
      expect(interactionRepo.findLikesReceived).toHaveBeenCalledWith('user-a', {
        page: 1,
        limit: 20,
      });
    });
  });
});
