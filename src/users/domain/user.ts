import { Exclude, Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { ApiProperty } from '@nestjs/swagger';
import databaseConfig from '../../database/config/database.config';
import { DatabaseConfig } from '../../database/config/database-config.type';

// <database-block>
const idType = (databaseConfig() as DatabaseConfig).isDocumentDatabase
  ? String
  : Number;
// </database-block>

export class User {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty({ type: String, example: 'Love hiking and coffee' })
  bio?: string;

  @ApiProperty({
    type: Object,
    example: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  })
  location?: { type: string; coordinates: [number, number] };

  @ApiProperty({ type: Date, example: '1995-06-15' })
  dateOfBirth?: Date;

  @ApiProperty({
    type: String,
    enum: ['male', 'female', 'non-binary', 'other'],
  })
  gender?: string;

  @ApiProperty({ type: [String], example: ['female', 'non-binary'] })
  genderPreference?: string[];

  @ApiProperty({ type: Number, example: 25 })
  ageMin?: number;

  @ApiProperty({ type: Number, example: 35 })
  ageMax?: number;

  @ApiProperty({ type: Number, example: 50 })
  maxDistanceKm?: number;

  @ApiProperty({ type: [String], example: ['hiking', 'coffee', 'travel'] })
  interests?: string[];

  @ApiProperty({ type: [String] })
  photoUrls?: string[];

  @ApiProperty({ type: Number, example: 85 })
  profileScore?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
