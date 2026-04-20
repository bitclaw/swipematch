import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { MessageType } from '../../../../domain/message';

export type MessageSchemaDocument = HydratedDocument<MessageSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'messages',
})
export class MessageSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchSchemaClass',
    required: true,
  })
  matchId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSchemaClass',
    required: true,
  })
  senderId: string;

  @Prop({ type: String, required: true, maxlength: 2000 })
  content: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.text })
  type: MessageType;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(MessageSchemaClass);

MessageSchema.index({ matchId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
