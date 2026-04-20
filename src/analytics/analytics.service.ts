import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InteractionSchemaClass } from '../interactions/infrastructure/persistence/document/entities/interaction.schema';
import { MatchSchemaClass } from '../matches/infrastructure/persistence/document/entities/match.schema';
import { MessageSchemaClass } from '../messages/infrastructure/persistence/document/entities/message.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(InteractionSchemaClass.name)
    private readonly interactionModel: Model<InteractionSchemaClass>,
    @InjectModel(MatchSchemaClass.name)
    private readonly matchModel: Model<MatchSchemaClass>,
    @InjectModel(MessageSchemaClass.name)
    private readonly messageModel: Model<MessageSchemaClass>,
  ) {}

  async getPopularProfiles(days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.interactionModel.aggregate([
      {
        $match: {
          action: { $in: ['like', 'superlike'] },
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$toUser',
          likesReceived: { $sum: 1 },
          superlikesReceived: {
            $sum: { $cond: [{ $eq: ['$action', 'superlike'] }, 1, 0] },
          },
        },
      },
      { $sort: { likesReceived: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
      {
        $project: {
          likesReceived: 1,
          superlikesReceived: 1,
          'profile.firstName': 1,
          'profile.lastName': 1,
          'profile.bio': 1,
          'profile.photoUrls': 1,
          'profile.profileScore': 1,
        },
      },
    ]);
  }

  async getEngagementMetrics(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.interactionModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          activeUsers: { $addToSet: '$fromUser' },
          totalSwipes: { $sum: 1 },
          likes: {
            $sum: {
              $cond: [{ $in: ['$action', ['like', 'superlike']] }, 1, 0],
            },
          },
          passes: {
            $sum: { $cond: [{ $eq: ['$action', 'pass'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          _id: 0,
          dauCount: { $size: '$activeUsers' },
          totalSwipes: 1,
          likes: 1,
          passes: 1,
          swipesPerUser: {
            $round: [
              { $divide: ['$totalSwipes', { $size: '$activeUsers' }] },
              1,
            ],
          },
          likeRate: {
            $round: [{ $divide: ['$likes', '$totalSwipes'] }, 3],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);
  }

  async getMatchFunnel(userId: string) {
    const userOid = new Types.ObjectId(userId);

    return this.interactionModel.aggregate([
      { $match: { fromUser: userOid } },
      {
        $facet: {
          totalSwipes: [{ $count: 'count' }],
          likes: [
            { $match: { action: { $in: ['like', 'superlike'] } } },
            { $count: 'count' },
          ],
          passes: [{ $match: { action: 'pass' } }, { $count: 'count' }],
          matches: [
            { $match: { action: { $in: ['like', 'superlike'] } } },
            {
              $lookup: {
                from: 'matches',
                let: { toUserId: '$toUser' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $in: [userOid, '$users'] },
                          { $in: ['$$toUserId', '$users'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'match',
              },
            },
            { $match: { 'match.0': { $exists: true } } },
            { $count: 'count' },
          ],
          conversations: [
            { $match: { action: { $in: ['like', 'superlike'] } } },
            {
              $lookup: {
                from: 'matches',
                let: { toUserId: '$toUser' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $in: [userOid, '$users'] },
                          { $in: ['$$toUserId', '$users'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'match',
              },
            },
            { $match: { 'match.0': { $exists: true } } },
            { $unwind: '$match' },
            {
              $lookup: {
                from: 'messages',
                localField: 'match._id',
                foreignField: 'matchId',
                as: 'msgs',
              },
            },
            { $match: { 'msgs.0': { $exists: true } } },
            { $count: 'count' },
          ],
        },
      },
    ]);
  }
}
