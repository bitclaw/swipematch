import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type MatchSchemaDocument = HydratedDocument<MatchSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'matches',
})
export class MatchSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'UserSchemaClass',
    required: true,
  })
  users: string[];

  @Prop({ type: Date, default: now })
  matchedAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'MessageSchemaClass' })
  lastMessage?: string;

  @Prop({ type: Date })
  lastMessageAt?: Date;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(MatchSchemaClass);

MatchSchema.index({ users: 1 });
MatchSchema.index({ matchedAt: -1 });
