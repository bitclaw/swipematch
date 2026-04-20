import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Interaction, InteractionAction } from '../../../../domain/interaction';
import { InteractionRepository } from '../../interaction.repository';
import { InteractionSchemaClass } from '../entities/interaction.schema';
import { InteractionMapper } from '../mappers/interaction.mapper';

@Injectable()
export class InteractionDocumentRepository implements InteractionRepository {
  constructor(
    @InjectModel(InteractionSchemaClass.name)
    private readonly interactionModel: Model<InteractionSchemaClass>,
  ) {}

  async create(
    data: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Interaction> {
    const created = new this.interactionModel(data);
    const saved = await created.save();
    return InteractionMapper.toDomain(saved);
  }

  async findByFromUserAndToUser(
    fromUser: string,
    toUser: string,
  ): Promise<NullableType<Interaction>> {
    const result = await this.interactionModel.findOne({ fromUser, toUser });
    return result ? InteractionMapper.toDomain(result) : null;
  }

  async findLikesReceived(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Interaction[]> {
    const results = await this.interactionModel
      .find({ toUser: userId, action: { $in: ['like', 'superlike'] } })
      .sort({ createdAt: -1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);
    return results.map(InteractionMapper.toDomain);
  }

  async findByFromUser(
    fromUser: string,
    action?: InteractionAction,
  ): Promise<Interaction[]> {
    const filter: Record<string, unknown> = { fromUser };
    if (action) {
      filter.action = action;
    }
    const results = await this.interactionModel
      .find(filter)
      .sort({ createdAt: -1 });
    return results.map(InteractionMapper.toDomain);
  }

  async findById(id: string): Promise<NullableType<Interaction>> {
    const result = await this.interactionModel.findById(id);
    return result ? InteractionMapper.toDomain(result) : null;
  }

  async remove(id: string): Promise<void> {
    await this.interactionModel.deleteOne({ _id: id });
  }
}
