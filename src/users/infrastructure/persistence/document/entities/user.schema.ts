import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';

import { AuthProvidersEnum } from '../../../../../auth/auth-providers.enum';
import { FileSchemaClass } from '../../../../../files/infrastructure/persistence/document/entities/file.schema';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { StatusSchema } from '../../../../../statuses/infrastructure/persistence/document/entities/status.schema';
import { RoleSchema } from '../../../../../roles/infrastructure/persistence/document/entities/role.schema';

export type UserSchemaDocument = HydratedDocument<UserSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'users',
})
export class UserSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
    unique: true,
  })
  email: string | null;

  @Prop()
  password?: string;

  @Prop({
    default: AuthProvidersEnum.email,
  })
  provider: string;

  @Prop({
    type: String,
    default: null,
  })
  socialId?: string | null;

  @Prop({
    type: String,
  })
  firstName: string | null;

  @Prop({
    type: String,
  })
  lastName: string | null;

  @Prop({
    type: FileSchemaClass,
  })
  photo?: FileSchemaClass | null;

  @Prop({
    type: RoleSchema,
  })
  role?: RoleSchema | null;

  @Prop({
    type: StatusSchema,
  })
  status?: StatusSchema;

  @Prop({ type: String })
  bio?: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  })
  location?: { type: string; coordinates: [number, number] };

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ type: String, enum: ['male', 'female', 'non-binary', 'other'] })
  gender?: string;

  @Prop({ type: [String], default: [] })
  genderPreference: string[];

  @Prop({ type: Number, min: 18, max: 100, default: 18 })
  ageMin: number;

  @Prop({ type: Number, min: 18, max: 100, default: 99 })
  ageMax: number;

  @Prop({ type: Number, default: 50, max: 200 })
  maxDistanceKm: number;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [String], default: [] })
  photoUrls: string[];

  @Prop({ type: Number, default: 0 })
  profileScore: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);

UserSchema.index({ 'role._id': 1 });
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ gender: 1, dateOfBirth: 1 });
UserSchema.index({ bio: 'text', interests: 'text' });
UserSchema.index({ profileScore: -1 });
