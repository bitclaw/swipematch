import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { DiscoveryService } from './discovery.service';
import {
  UserSchema,
  UserSchemaClass,
} from '../users/infrastructure/persistence/document/entities/user.schema';
import {
  InteractionSchema,
  InteractionSchemaClass,
} from '../interactions/infrastructure/persistence/document/entities/interaction.schema';

describe('DiscoveryService (integration)', () => {
  let service: DiscoveryService;
  let userModel: Model<UserSchemaClass>;
  let interactionModel: Model<InteractionSchemaClass>;
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
          { name: UserSchemaClass.name, schema: UserSchema },
          { name: InteractionSchemaClass.name, schema: InteractionSchema },
        ]),
      ],
      providers: [DiscoveryService],
    }).compile();

    service = module.get(DiscoveryService);
    userModel = module.get(getModelToken(UserSchemaClass.name));
    interactionModel = module.get(getModelToken(InteractionSchemaClass.name));

    await userModel.ensureIndexes();
  }, 60000);

  afterAll(async () => {
    await module.close();
    await mongod.stop();
  }, 30000);

  beforeEach(async () => {
    await userModel.deleteMany({});
    await interactionModel.deleteMany({});
  });

  it('should return users within radius sorted by distance', async () => {
    const searcher = await userModel.create({
      email: 'searcher@test.com',
      firstName: 'Searcher',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0, 0] },
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      genderPreference: ['female'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    // ~1.5km away
    await userModel.create({
      email: 'nearby@test.com',
      firstName: 'Nearby',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.01, 0.01] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: ['male'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    // ~157km away (should be excluded with 50km radius)
    await userModel.create({
      email: 'far@test.com',
      firstName: 'Far',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [1, 1] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: ['male'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    const results = await service.findNearbyUsers(searcher._id.toString(), {
      lat: 0,
      lng: 0,
      maxDistanceKm: 50,
    });

    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('Nearby');
    expect(results[0].distance).toBeLessThan(50000);
  });

  it('should exclude already-swiped users', async () => {
    const searcher = await userModel.create({
      email: 'searcher2@test.com',
      firstName: 'Searcher',
      lastName: 'Two',
      provider: 'email',
      location: { type: 'Point', coordinates: [0, 0] },
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      genderPreference: ['female'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 100,
    });

    const swiped = await userModel.create({
      email: 'swiped@test.com',
      firstName: 'Swiped',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.001, 0.001] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: ['male'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    const unswiped = await userModel.create({
      email: 'unswiped@test.com',
      firstName: 'Unswiped',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.002, 0.002] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: ['male'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    await interactionModel.create({
      fromUser: searcher._id.toString(),
      toUser: swiped._id.toString(),
      action: 'like',
    });

    const results = await service.findNearbyUsers(searcher._id.toString(), {
      lat: 0,
      lng: 0,
      maxDistanceKm: 100,
    });

    expect(results).toHaveLength(1);
    expect(results[0]._id.toString()).toBe(unswiped._id.toString());
  });

  it('should filter by gender preference', async () => {
    const searcher = await userModel.create({
      email: 'searcher3@test.com',
      firstName: 'Searcher',
      lastName: 'Three',
      provider: 'email',
      location: { type: 'Point', coordinates: [0, 0] },
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      genderPreference: ['female'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 100,
    });

    await userModel.create({
      email: 'female@test.com',
      firstName: 'Female',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.001, 0.001] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: ['male'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    await userModel.create({
      email: 'male@test.com',
      firstName: 'Male',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.001, 0.001] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'male',
      genderPreference: ['female'],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    const results = await service.findNearbyUsers(searcher._id.toString(), {
      lat: 0,
      lng: 0,
      maxDistanceKm: 100,
    });

    expect(results).toHaveLength(1);
    expect(results[0].gender).toBe('female');
  });

  it('should filter by age range', async () => {
    const searcher = await userModel.create({
      email: 'searcher4@test.com',
      firstName: 'Searcher',
      lastName: 'Four',
      provider: 'email',
      location: { type: 'Point', coordinates: [0, 0] },
      dateOfBirth: new Date('1995-01-01'),
      gender: 'male',
      genderPreference: [],
      ageMin: 25,
      ageMax: 30,
      maxDistanceKm: 100,
    });

    // Age ~28 (in range)
    await userModel.create({
      email: 'inrange@test.com',
      firstName: 'InRange',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.001, 0.001] },
      dateOfBirth: new Date('1998-01-01'),
      gender: 'female',
      genderPreference: [],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    // Age ~18 (out of range)
    await userModel.create({
      email: 'young@test.com',
      firstName: 'Young',
      lastName: 'User',
      provider: 'email',
      location: { type: 'Point', coordinates: [0.001, 0.001] },
      dateOfBirth: new Date('2008-01-01'),
      gender: 'female',
      genderPreference: [],
      ageMin: 18,
      ageMax: 40,
      maxDistanceKm: 50,
    });

    const results = await service.findNearbyUsers(searcher._id.toString(), {
      lat: 0,
      lng: 0,
      maxDistanceKm: 100,
    });

    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('InRange');
  });
});
