import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { InteractionAction } from '../domain/interaction';

export class CreateInteractionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ enum: InteractionAction, example: InteractionAction.like })
  @IsEnum(InteractionAction)
  @IsNotEmpty()
  action: InteractionAction;
}
