import { Match } from '../../../../domain/match';
import { MatchSchemaClass } from '../entities/match.schema';

export class MatchMapper {
  static toDomain(raw: MatchSchemaClass): Match {
    const domainEntity = new Match();
    domainEntity.id = raw._id.toString();
    domainEntity.users = raw.users.map((u) => u.toString());
    domainEntity.matchedAt = raw.matchedAt;
    domainEntity.isActive = raw.isActive;
    domainEntity.lastMessage = raw.lastMessage?.toString() ?? null;
    domainEntity.lastMessageAt = raw.lastMessageAt ?? null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Match): MatchSchemaClass {
    const persistenceSchema = new MatchSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.users = domainEntity.users;
    persistenceSchema.matchedAt = domainEntity.matchedAt;
    persistenceSchema.isActive = domainEntity.isActive;
    if (domainEntity.lastMessage) {
      persistenceSchema.lastMessage = domainEntity.lastMessage;
    }
    persistenceSchema.lastMessageAt = domainEntity.lastMessageAt ?? undefined;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    return persistenceSchema;
  }
}
