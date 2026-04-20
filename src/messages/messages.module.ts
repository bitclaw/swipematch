import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { DocumentMessagePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [DocumentMessagePersistenceModule, MatchesModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService, DocumentMessagePersistenceModule],
})
export class MessagesModule {}
