import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
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
import {
  UserSchema,
  UserSchemaClass,
} from '../users/infrastructure/persistence/document/entities/user.schema';

describe('AnalyticsService (integration)', () => {
  let service: AnalyticsService;
  let interactionModel: Model<InteractionSchemaClass>;
  let matchModel: Model<MatchSchemaClass>;
  let messageModel: Model<MessageSchemaClass>;
  let userModel: Model<UserSchemaClass>;
  let mongod: MongoMemoryReplSet;
  let module: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: InteractionSchemaClass.name, schema: InteractionSchema },
          { name: MatchSchemaClass.name, schema: MatchSchema },
          { name: MessageSchemaClass.name, schema: MessageSchema },
          { name: UserSchemaClass.name, schema: UserSchema },
        ]),
      ],
      providers: [AnalyticsService],
    }).compile();

    service = module.get(AnalyticsService);
    interactionModel = module.get(getModelToken(InteractionSchemaClass.name));
    matchModel = module.get(getModelToken(MatchSchemaClass.name));
    messageModel = module.get(getModelToken(MessageSchemaClass.name));
    userModel = module.get(getModelToken(UserSchemaClass.name));
  }, 60000);

  afterAll(async () => {
    await module.close();
    await mongod.stop();
  }, 30000);

  beforeEach(async () => {
    await interactionModel.deleteMany({});
    await matchModel.deleteMany({});
    await messageModel.deleteMany({});
    await userModel.deleteMany({});
  });

  describe('getPopularProfiles', () => {
    it('should return profiles sorted by likes received', async () => {
      const userA = await userModel.create({
        email: 'a@test.com',
        firstName: 'A',
        lastName: 'User',
        provider: 'email',
      });
      const userB = await userModel.create({
        email: 'b@test.com',
        firstName: 'B',
        lastName: 'User',
        provider: 'email',
      });
      const userC = await userModel.create({
        email: 'c@test.com',
        firstName: 'C',
        lastName: 'User',
        provider: 'email',
      });

      // B gets 3 likes, A gets 1 like
      await interactionModel.create([
        { fromUser: userA._id.toString(), toUser: userB._id.toString(), action: 'like' },
        { fromUser: userC._id.toString(), toUser: userB._id.toString(), action: 'like' },
        {
          fromUser: new Types.ObjectId().toString(),
          toUser: userB._id.toString(),
          action: 'superlike',
        },
        { fromUser: userB._id.toString(), toUser: userA._id.toString(), action: 'like' },
      ]);

      const results = await service.getPopularProfiles(7);

      expect(results).toHaveLength(2);
      expect(results[0].likesReceived).toBe(3);
      expect(results[0].profile.firstName).toBe('B');
      expect(results[0].superlikesReceived).toBe(1);
      expect(results[1].likesReceived).toBe(1);
      expect(results[1].profile.firstName).toBe('A');
    });

    it('should exclude interactions outside timeframe', async () => {
      const userA = await userModel.create({
        email: 'a2@test.com',
        firstName: 'A',
        lastName: 'User',
        provider: 'email',
      });
      const userB = new Types.ObjectId();

      // Recent like
      await interactionModel.create({
        fromUser: userB.toString(),
        toUser: userA._id.toString(),
        action: 'like',
      });

      // Old like (manually set createdAt to 30 days ago)
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await interactionModel.create({
        fromUser: new Types.ObjectId().toString(),
        toUser: userA._id.toString(),
        action: 'like',
        createdAt: oldDate,
      });

      const results = await service.getPopularProfiles(7);

      expect(results).toHaveLength(1);
      expect(results[0].likesReceived).toBe(1);
    });
  });

  describe('getEngagementMetrics', () => {
    it('should compute daily metrics', async () => {
      const userA = new Types.ObjectId();
      const userB = new Types.ObjectId();
      const userC = new Types.ObjectId();

      await interactionModel.create([
        { fromUser: userA.toString(), toUser: new Types.ObjectId().toString(), action: 'like' },
        { fromUser: userA.toString(), toUser: new Types.ObjectId().toString(), action: 'pass' },
        { fromUser: userB.toString(), toUser: new Types.ObjectId().toString(), action: 'like' },
        { fromUser: userC.toString(), toUser: new Types.ObjectId().toString(), action: 'superlike' },
      ]);

      const results = await service.getEngagementMetrics(7);

      expect(results).toHaveLength(1);
      expect(results[0].dauCount).toBe(3);
      expect(results[0].totalSwipes).toBe(4);
      expect(results[0].likes).toBe(3);
      expect(results[0].passes).toBe(1);
    });
  });

  describe('getMatchFunnel', () => {
    it('should compute the conversion funnel', async () => {
      const userA = new Types.ObjectId();
      const userB = new Types.ObjectId();
      const userC = new Types.ObjectId();
      const userD = new Types.ObjectId();

      // User A: 3 swipes (2 likes, 1 pass)
      await interactionModel.create([
        { fromUser: userA.toString(), toUser: userB.toString(), action: 'like' },
        { fromUser: userA.toString(), toUser: userC.toString(), action: 'like' },
        { fromUser: userA.toString(), toUser: userD.toString(), action: 'pass' },
      ]);

      // Match with userB
      const match = await matchModel.create({
        users: [userA.toString(), userB.toString()],
        matchedAt: new Date(),
        isActive: true,
      });

      // Conversation with userB
      await messageModel.create({
        matchId: match._id.toString(),
        senderId: userA.toString(),
        content: 'Hello!',
        type: 'text',
        isRead: false,
      });

      const results = await service.getMatchFunnel(userA.toString());

      expect(results).toHaveLength(1);
      const funnel = results[0];
      expect(funnel.totalSwipes[0].count).toBe(3);
      expect(funnel.likes[0].count).toBe(2);
      expect(funnel.passes[0].count).toBe(1);
      expect(funnel.matches[0].count).toBe(1);
      expect(funnel.conversations[0].count).toBe(1);
    });
  });
});
