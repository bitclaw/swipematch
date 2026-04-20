import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchSchema, MatchSchemaClass } from './entities/match.schema';
import { MatchRepository } from '../match.repository';
import { MatchDocumentRepository } from './repositories/match.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchSchemaClass.name, schema: MatchSchema },
    ]),
  ],
  providers: [
    {
      provide: MatchRepository,
      useClass: MatchDocumentRepository,
    },
  ],
  exports: [MatchRepository],
})
export class DocumentMatchPersistenceModule {}
