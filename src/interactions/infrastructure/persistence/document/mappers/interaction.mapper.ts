import { Interaction } from '../../../../domain/interaction';
import { InteractionSchemaClass } from '../entities/interaction.schema';

export class InteractionMapper {
  static toDomain(raw: InteractionSchemaClass): Interaction {
    const domainEntity = new Interaction();
    domainEntity.id = raw._id.toString();
    domainEntity.fromUser = raw.fromUser.toString();
    domainEntity.toUser = raw.toUser.toString();
    domainEntity.action = raw.action;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Interaction): InteractionSchemaClass {
    const persistenceSchema = new InteractionSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.fromUser = domainEntity.fromUser;
    persistenceSchema.toUser = domainEntity.toUser;
    persistenceSchema.action = domainEntity.action;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    return persistenceSchema;
  }
}
