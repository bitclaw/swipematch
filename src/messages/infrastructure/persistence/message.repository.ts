import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Message } from '../../domain/message';

export abstract class MessageRepository {
  abstract create(
    data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Message>;

  abstract findById(id: string): Promise<NullableType<Message>>;

  abstract findByMatchId(
    matchId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Message[]>;

  abstract markAsRead(id: string): Promise<Message | null>;

  abstract remove(id: string): Promise<void>;
}
