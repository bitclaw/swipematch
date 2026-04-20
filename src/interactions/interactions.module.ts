import { Module, forwardRef } from '@nestjs/common';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { DocumentInteractionPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [
    DocumentInteractionPersistenceModule,
    forwardRef(() => MatchesModule),
  ],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService, DocumentInteractionPersistenceModule],
})
export class InteractionsModule {}
