import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DiscoveryService } from './discovery.service';
import { UserSchemaClass } from '../users/infrastructure/persistence/document/entities/user.schema';

const MOCK_USER_ID = new Types.ObjectId().toString();

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let userModel: Record<string, jest.Mock>;

  beforeEach(async () => {
    userModel = {
      findById: jest.fn().mockReturnValue({ lean: jest.fn() }),
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        {
          provide: getModelToken(UserSchemaClass.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get(DiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findNearbyUsers', () => {
    it('should return empty array when user not found', async () => {
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findNearbyUsers('unknown-id', {
        lat: 37.7749,
        lng: -122.4194,
      });

      expect(result).toEqual([]);
      expect(userModel.aggregate).not.toHaveBeenCalled();
    });

    it('should call aggregate with $geoNear as first stage', async () => {
      const currentUser = {
        _id: MOCK_USER_ID,
        maxDistanceKm: 50,
        ageMin: 25,
        ageMax: 35,
        genderPreference: ['female'],
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(currentUser),
      });
      userModel.aggregate.mockResolvedValue([]);

      await service.findNearbyUsers(MOCK_USER_ID, {
        lat: 37.7749,
        lng: -122.4194,
      });

      expect(userModel.aggregate).toHaveBeenCalledTimes(1);
      const pipeline = userModel.aggregate.mock.calls[0][0];
      expect(pipeline[0]).toHaveProperty('$geoNear');
      expect(pipeline[0].$geoNear.near.coordinates).toEqual([
        -122.4194, 37.7749,
      ]);
    });

    it('should use query params over user defaults', async () => {
      const currentUser = {
        _id: MOCK_USER_ID,
        maxDistanceKm: 50,
        ageMin: 25,
        ageMax: 35,
        genderPreference: [],
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(currentUser),
      });
      userModel.aggregate.mockResolvedValue([]);

      await service.findNearbyUsers(MOCK_USER_ID, {
        lat: 40.7128,
        lng: -74.006,
        maxDistanceKm: 10,
        ageMin: 20,
        ageMax: 30,
        limit: 5,
      });

      const pipeline = userModel.aggregate.mock.calls[0][0];
      expect(pipeline[0].$geoNear.maxDistance).toBe(10000);
      const limitStage = pipeline.find(
        (s: Record<string, unknown>) => '$limit' in s,
      );
      expect(limitStage.$limit).toBe(5);
    });

    it('should include gender filter when user has preferences', async () => {
      const currentUser = {
        _id: MOCK_USER_ID,
        maxDistanceKm: 50,
        ageMin: 25,
        ageMax: 35,
        genderPreference: ['female', 'non-binary'],
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(currentUser),
      });
      userModel.aggregate.mockResolvedValue([]);

      await service.findNearbyUsers(MOCK_USER_ID, {
        lat: 37.7749,
        lng: -122.4194,
      });

      const pipeline = userModel.aggregate.mock.calls[0][0];
      expect(pipeline[0].$geoNear.query.gender).toEqual({
        $in: ['female', 'non-binary'],
      });
    });

    it('should not include gender filter when preferences are empty', async () => {
      const currentUser = {
        _id: MOCK_USER_ID,
        maxDistanceKm: 50,
        ageMin: 25,
        ageMax: 35,
        genderPreference: [],
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(currentUser),
      });
      userModel.aggregate.mockResolvedValue([]);

      await service.findNearbyUsers(MOCK_USER_ID, {
        lat: 37.7749,
        lng: -122.4194,
      });

      const pipeline = userModel.aggregate.mock.calls[0][0];
      expect(pipeline[0].$geoNear.query.gender).toBeUndefined();
    });

    it('should include $lookup to exclude already-swiped users', async () => {
      const currentUser = {
        _id: MOCK_USER_ID,
        maxDistanceKm: 50,
        ageMin: 25,
        ageMax: 35,
        genderPreference: [],
      };
      userModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(currentUser),
      });
      userModel.aggregate.mockResolvedValue([]);

      await service.findNearbyUsers(MOCK_USER_ID, {
        lat: 37.7749,
        lng: -122.4194,
      });

      const pipeline = userModel.aggregate.mock.calls[0][0];
      const lookupStage = pipeline.find(
        (s: Record<string, unknown>) => '$lookup' in s,
      );
      expect(lookupStage).toBeDefined();
      expect(lookupStage.$lookup.from).toBe('interactions');
    });
  });
});
