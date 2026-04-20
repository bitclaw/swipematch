import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
  text = 'text',
  image = 'image',
  gif = 'gif',
}

export class Message {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  matchId: string;

  @ApiProperty({ type: String })
  senderId: string;

  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ type: Boolean })
  isRead: boolean;

  @ApiProperty({ type: Date, nullable: true })
  readAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
