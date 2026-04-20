import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { DocumentMatchPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

@Module({
  imports: [DocumentMatchPersistenceModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService, DocumentMatchPersistenceModule],
})
export class MatchesModule {}
