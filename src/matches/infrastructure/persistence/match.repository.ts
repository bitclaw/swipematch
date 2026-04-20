import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Match } from '../../domain/match';

export abstract class MatchRepository {
  abstract create(
    data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Match>;

  abstract findById(id: string): Promise<NullableType<Match>>;

  abstract findByUserId(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<Match[]>;

  abstract findByUsers(
    userIdA: string,
    userIdB: string,
  ): Promise<NullableType<Match>>;

  abstract update(id: string, payload: Partial<Match>): Promise<Match | null>;

  abstract deactivate(id: string): Promise<void>;
}
