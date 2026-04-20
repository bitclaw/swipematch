import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { InteractionAction } from '../../../../domain/interaction';

export type InteractionSchemaDocument =
  HydratedDocument<InteractionSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'interactions',
})
export class InteractionSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSchemaClass',
    required: true,
  })
  fromUser: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSchemaClass',
    required: true,
  })
  toUser: string;

  @Prop({
    type: String,
    enum: InteractionAction,
    required: true,
  })
  action: InteractionAction;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const InteractionSchema = SchemaFactory.createForClass(
  InteractionSchemaClass,
);

InteractionSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
InteractionSchema.index({ toUser: 1, action: 1 });
InteractionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
