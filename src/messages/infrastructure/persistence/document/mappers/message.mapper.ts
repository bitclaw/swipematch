import { Message } from '../../../../domain/message';
import { MessageSchemaClass } from '../entities/message.schema';

export class MessageMapper {
  static toDomain(raw: MessageSchemaClass): Message {
    const domainEntity = new Message();
    domainEntity.id = raw._id.toString();
    domainEntity.matchId = raw.matchId.toString();
    domainEntity.senderId = raw.senderId.toString();
    domainEntity.content = raw.content;
    domainEntity.type = raw.type;
    domainEntity.isRead = raw.isRead;
    domainEntity.readAt = raw.readAt ?? null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Message): MessageSchemaClass {
    const persistenceSchema = new MessageSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.matchId = domainEntity.matchId;
    persistenceSchema.senderId = domainEntity.senderId;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.isRead = domainEntity.isRead;
    persistenceSchema.readAt = domainEntity.readAt ?? undefined;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    return persistenceSchema;
  }
}
