import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Match } from '../../../../domain/match';
import { MatchRepository } from '../../match.repository';
import { MatchSchemaClass } from '../entities/match.schema';
import { MatchMapper } from '../mappers/match.mapper';

@Injectable()
export class MatchDocumentRepository implements MatchRepository {
  constructor(
    @InjectModel(MatchSchemaClass.name)
    private readonly matchModel: Model<MatchSchemaClass>,
  ) {}

  async create(
    data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Match> {
    const created = new this.matchModel(data);
    const saved = await created.save();
    return MatchMapper.toDomain(saved);
  }

  async findById(id: string): Promise<NullableType<Match>> {
    const result = await this.matchModel.findById(id);
    return result ? MatchMapper.toDomain(result) : null;
  }

  async findByUserId(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Match[]> {
    const results = await this.matchModel
      .find({ users: userId, isActive: true })
      .sort({ lastMessageAt: -1, matchedAt: -1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);
    return results.map(MatchMapper.toDomain);
  }

  async findByUsers(
    userIdA: string,
    userIdB: string,
  ): Promise<NullableType<Match>> {
    const result = await this.matchModel.findOne({
      users: { $all: [userIdA, userIdB] },
      isActive: true,
    });
    return result ? MatchMapper.toDomain(result) : null;
  }

  async update(id: string, payload: Partial<Match>): Promise<Match | null> {
    const result = await this.matchModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result ? MatchMapper.toDomain(result) : null;
  }

  async deactivate(id: string): Promise<void> {
    await this.matchModel.findByIdAndUpdate(id, { isActive: false });
  }
}
