import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageRepository } from './infrastructure/persistence/message.repository';
import { MatchesService } from '../matches/matches.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message, MessageType } from './domain/message';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly matchesService: MatchesService,
  ) {}

  async create(senderId: string, dto: CreateMessageDto): Promise<Message> {
    const isInMatch = await this.matchesService.isUserInMatch(
      dto.matchId,
      senderId,
    );
    if (!isInMatch) {
      throw new ForbiddenException({
        errors: { match: 'notParticipant' },
      });
    }

    const message = await this.messageRepository.create({
      matchId: dto.matchId,
      senderId,
      content: dto.content,
      type: dto.type ?? MessageType.text,
      isRead: false,
      readAt: null,
    });

    await this.matchesService.updateLastMessage(dto.matchId, message.id);

    return message;
  }

  async findByMatchId(
    matchId: string,
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Message[]> {
    const isInMatch = await this.matchesService.isUserInMatch(matchId, userId);
    if (!isInMatch) {
      throw new ForbiddenException({
        errors: { match: 'notParticipant' },
      });
    }
    return this.messageRepository.findByMatchId(matchId, paginationOptions);
  }

  async markAsRead(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new NotFoundException({ errors: { message: 'notFound' } });
    }

    const isInMatch = await this.matchesService.isUserInMatch(
      message.matchId,
      userId,
    );
    if (!isInMatch) {
      throw new ForbiddenException({
        errors: { match: 'notParticipant' },
      });
    }

    const updated = await this.messageRepository.markAsRead(id);
    if (!updated) {
      throw new NotFoundException({ errors: { message: 'notFound' } });
    }
    return updated;
  }
}
