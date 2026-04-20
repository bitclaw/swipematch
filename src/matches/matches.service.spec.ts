import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchRepository } from './infrastructure/persistence/match.repository';

describe('MatchesService', () => {
  let service: MatchesService;
  let matchRepo: jest.Mocked<MatchRepository>;

  const mockMatch = {
    id: 'match-1',
    users: ['user-a', 'user-b'],
    matchedAt: new Date(),
    isActive: true,
    lastMessage: null,
    lastMessageAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: MatchRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByUsers: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MatchesService);
    matchRepo = module.get(MatchRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMatch', () => {
    it('should create a new match between two users', async () => {
      matchRepo.findByUsers.mockResolvedValue(null);
      matchRepo.create.mockResolvedValue(mockMatch);

      const result = await service.createMatch('user-a', 'user-b');

      expect(result).toEqual(mockMatch);
      expect(matchRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          users: ['user-a', 'user-b'],
          isActive: true,
        }),
      );
    });

    it('should return existing match if already matched', async () => {
      matchRepo.findByUsers.mockResolvedValue(mockMatch);

      const result = await service.createMatch('user-a', 'user-b');

      expect(result).toEqual(mockMatch);
      expect(matchRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('unmatch', () => {
    it('should deactivate a match', async () => {
      matchRepo.findById.mockResolvedValue(mockMatch);

      await service.unmatch('match-1', 'user-a');

      expect(matchRepo.deactivate).toHaveBeenCalledWith('match-1');
    });

    it('should throw if match not found', async () => {
      matchRepo.findById.mockResolvedValue(null);

      await expect(service.unmatch('match-1', 'user-a')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if user is not part of the match', async () => {
      matchRepo.findById.mockResolvedValue(mockMatch);

      await expect(service.unmatch('match-1', 'user-c')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isUserInMatch', () => {
    it('should return true when user is in an active match', async () => {
      matchRepo.findById.mockResolvedValue(mockMatch);

      const result = await service.isUserInMatch('match-1', 'user-a');

      expect(result).toBe(true);
    });

    it('should return false when match not found', async () => {
      matchRepo.findById.mockResolvedValue(null);

      const result = await service.isUserInMatch('match-1', 'user-a');

      expect(result).toBe(false);
    });

    it('should return false when match is inactive', async () => {
      matchRepo.findById.mockResolvedValue({ ...mockMatch, isActive: false });

      const result = await service.isUserInMatch('match-1', 'user-a');

      expect(result).toBe(false);
    });

    it('should return false when user is not a participant', async () => {
      matchRepo.findById.mockResolvedValue(mockMatch);

      const result = await service.isUserInMatch('match-1', 'user-c');

      expect(result).toBe(false);
    });
  });

  describe('updateLastMessage', () => {
    it('should update last message on match', async () => {
      matchRepo.update.mockResolvedValue(mockMatch);

      await service.updateLastMessage('match-1', 'msg-1');

      expect(matchRepo.update).toHaveBeenCalledWith(
        'match-1',
        expect.objectContaining({ lastMessage: 'msg-1' }),
      );
    });
  });
});
