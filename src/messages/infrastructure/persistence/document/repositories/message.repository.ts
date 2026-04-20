import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Message } from '../../../../domain/message';
import { MessageRepository } from '../../message.repository';
import { MessageSchemaClass } from '../entities/message.schema';
import { MessageMapper } from '../mappers/message.mapper';

@Injectable()
export class MessageDocumentRepository implements MessageRepository {
  constructor(
    @InjectModel(MessageSchemaClass.name)
    private readonly messageModel: Model<MessageSchemaClass>,
  ) {}

  async create(
    data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Message> {
    const created = new this.messageModel(data);
    const saved = await created.save();
    return MessageMapper.toDomain(saved);
  }

  async findById(id: string): Promise<NullableType<Message>> {
    const result = await this.messageModel.findById(id);
    return result ? MessageMapper.toDomain(result) : null;
  }

  async findByMatchId(
    matchId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Message[]> {
    const results = await this.messageModel
      .find({ matchId })
      .sort({ createdAt: 1 })
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);
    return results.map(MessageMapper.toDomain);
  }

  async markAsRead(id: string): Promise<Message | null> {
    const result = await this.messageModel.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    return result ? MessageMapper.toDomain(result) : null;
  }

  async remove(id: string): Promise<void> {
    await this.messageModel.deleteOne({ _id: id });
  }
}
