import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InteractionSchema,
  InteractionSchemaClass,
} from './entities/interaction.schema';
import { InteractionRepository } from '../interaction.repository';
import { InteractionDocumentRepository } from './repositories/interaction.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InteractionSchemaClass.name, schema: InteractionSchema },
    ]),
  ],
  providers: [
    {
      provide: InteractionRepository,
      useClass: InteractionDocumentRepository,
    },
  ],
  exports: [InteractionRepository],
})
export class DocumentInteractionPersistenceModule {}
