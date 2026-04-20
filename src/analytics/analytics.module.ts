import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  InteractionSchema,
  InteractionSchemaClass,
} from '../interactions/infrastructure/persistence/document/entities/interaction.schema';
import {
  MatchSchema,
  MatchSchemaClass,
} from '../matches/infrastructure/persistence/document/entities/match.schema';
import {
  MessageSchema,
  MessageSchemaClass,
} from '../messages/infrastructure/persistence/document/entities/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InteractionSchemaClass.name, schema: InteractionSchema },
      { name: MatchSchemaClass.name, schema: MatchSchema },
      { name: MessageSchemaClass.name, schema: MessageSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
