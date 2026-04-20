import { ApiProperty } from '@nestjs/swagger';

export class Match {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: [String] })
  users: string[];

  @ApiProperty()
  matchedAt: Date;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: String, nullable: true })
  lastMessage?: string | null;

  @ApiProperty({ type: Date, nullable: true })
  lastMessageAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
