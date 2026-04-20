import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSchemaClass } from '../users/infrastructure/persistence/document/entities/user.schema';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
  ) {}

  async findNearbyUsers(userId: string, query: DiscoveryQueryDto) {
    const currentUser = await this.userModel.findById(userId).lean();
    if (!currentUser) return [];

    const maxDistanceMeters =
      (query.maxDistanceKm ?? currentUser.maxDistanceKm ?? 50) * 1000;
    const ageMin = query.ageMin ?? currentUser.ageMin ?? 18;
    const ageMax = query.ageMax ?? currentUser.ageMax ?? 99;
    const limit = query.limit ?? 20;

    const genderFilter =
      currentUser.genderPreference?.length > 0
        ? { gender: { $in: currentUser.genderPreference } }
        : {};

    return this.userModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [query.lng, query.lat],
          },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            _id: { $ne: new Types.ObjectId(userId) },
            ...genderFilter,
          },
        },
      },
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: '$dateOfBirth',
              endDate: '$$NOW',
              unit: 'year',
            },
          },
        },
      },
      {
        $match: {
          age: { $gte: ageMin, $lte: ageMax },
        },
      },
      {
        $lookup: {
          from: 'interactions',
          let: { targetId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$fromUser', new Types.ObjectId(userId)] },
                    { $eq: ['$toUser', '$$targetId'] },
                  ],
                },
              },
            },
          ],
          as: 'existingInteractions',
        },
      },
      { $match: { existingInteractions: { $size: 0 } } },
      {
        $project: {
          password: 0,
          existingInteractions: 0,
          'role._id': 0,
          'status._id': 0,
        },
      },
      { $sort: { distance: 1 } },
      { $limit: limit },
    ]);
  }
}
