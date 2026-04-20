import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchRepository } from './infrastructure/persistence/match.repository';
import { Match } from './domain/match';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class MatchesService {
  constructor(private readonly matchRepository: MatchRepository) {}

  async createMatch(userIdA: string, userIdB: string): Promise<Match> {
    const existing = await this.matchRepository.findByUsers(userIdA, userIdB);
    if (existing) {
      return existing;
    }

    return this.matchRepository.create({
      users: [userIdA, userIdB],
      matchedAt: new Date(),
      isActive: true,
      lastMessage: null,
      lastMessageAt: null,
    });
  }

  findByUserId(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Match[]> {
    return this.matchRepository.findByUserId(userId, paginationOptions);
  }

  findById(id: string): Promise<NullableType<Match>> {
    return this.matchRepository.findById(id);
  }

  async unmatch(id: string, userId: string): Promise<void> {
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new NotFoundException({ errors: { match: 'notFound' } });
    }
    if (!match.users.includes(userId)) {
      throw new NotFoundException({ errors: { match: 'notFound' } });
    }
    await this.matchRepository.deactivate(id);
  }

  async updateLastMessage(matchId: string, messageId: string): Promise<void> {
    await this.matchRepository.update(matchId, {
      lastMessage: messageId,
      lastMessageAt: new Date(),
    });
  }

  async isUserInMatch(matchId: string, userId: string): Promise<boolean> {
    const match = await this.matchRepository.findById(matchId);
    if (!match || !match.isActive) return false;
    return match.users.includes(userId);
  }
}
