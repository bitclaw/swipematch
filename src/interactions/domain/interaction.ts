import { ApiProperty } from '@nestjs/swagger';

export enum InteractionAction {
  like = 'like',
  pass = 'pass',
  superlike = 'superlike',
}

export class Interaction {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  fromUser: string;

  @ApiProperty({ type: String })
  toUser: string;

  @ApiProperty({ enum: InteractionAction })
  action: InteractionAction;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
