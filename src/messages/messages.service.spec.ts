import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageRepository } from './infrastructure/persistence/message.repository';
import { MatchesService } from '../matches/matches.service';
import { MessageType } from './domain/message';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepo: jest.Mocked<MessageRepository>;
  let matchesService: jest.Mocked<MatchesService>;

  const mockMessage = {
    id: 'msg-1',
    matchId: 'match-1',
    senderId: 'user-a',
    content: 'Hello!',
    type: MessageType.text,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessageRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByMatchId: jest.fn(),
            markAsRead: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: MatchesService,
          useValue: {
            isUserInMatch: jest.fn(),
            updateLastMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(MessagesService);
    messageRepo = module.get(MessageRepository);
    matchesService = module.get(MatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { matchId: 'match-1', content: 'Hello!' };

    it('should create a message and update last message on match', async () => {
      matchesService.isUserInMatch.mockResolvedValue(true);
      messageRepo.create.mockResolvedValue(mockMessage);

      const result = await service.create('user-a', dto);

      expect(result).toEqual(mockMessage);
      expect(matchesService.updateLastMessage).toHaveBeenCalledWith(
        'match-1',
        'msg-1',
      );
    });

    it('should throw ForbiddenException if sender is not in match', async () => {
      matchesService.isUserInMatch.mockResolvedValue(false);

      await expect(service.create('user-c', dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(messageRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findByMatchId', () => {
    it('should return messages for a match', async () => {
      matchesService.isUserInMatch.mockResolvedValue(true);
      messageRepo.findByMatchId.mockResolvedValue([mockMessage]);

      const result = await service.findByMatchId('match-1', 'user-a', {
        page: 1,
        limit: 50,
      });

      expect(result).toEqual([mockMessage]);
    });

    it('should throw ForbiddenException if user is not in match', async () => {
      matchesService.isUserInMatch.mockResolvedValue(false);

      await expect(
        service.findByMatchId('match-1', 'user-c', { page: 1, limit: 50 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAsRead', () => {
    it('should mark a message as read', async () => {
      const readMessage = { ...mockMessage, isRead: true, readAt: new Date() };
      messageRepo.findById.mockResolvedValue(mockMessage);
      matchesService.isUserInMatch.mockResolvedValue(true);
      messageRepo.markAsRead.mockResolvedValue(readMessage);

      const result = await service.markAsRead('msg-1', 'user-a');

      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if message not found', async () => {
      messageRepo.findById.mockResolvedValue(null);

      await expect(service.markAsRead('msg-x', 'user-a')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not in match', async () => {
      messageRepo.findById.mockResolvedValue(mockMessage);
      matchesService.isUserInMatch.mockResolvedValue(false);

      await expect(service.markAsRead('msg-1', 'user-c')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
