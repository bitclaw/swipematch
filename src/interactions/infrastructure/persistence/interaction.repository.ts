import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Interaction, InteractionAction } from '../../domain/interaction';

export abstract class InteractionRepository {
  abstract create(
    data: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Interaction>;

  abstract findByFromUserAndToUser(
    fromUser: string,
    toUser: string,
  ): Promise<NullableType<Interaction>>;

  abstract findLikesReceived(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Interaction[]>;

  abstract findByFromUser(
    fromUser: string,
    action?: InteractionAction,
  ): Promise<Interaction[]>;

  abstract findById(id: string): Promise<NullableType<Interaction>>;

  abstract remove(id: string): Promise<void>;
}
