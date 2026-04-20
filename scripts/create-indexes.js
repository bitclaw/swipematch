// SwipeMatch — Index Creation Script
// Run: mongosh < scripts/create-indexes.js
// Note: Indexes are also defined inline on Mongoose schemas and created automatically.
// This script serves as documentation and for manual setup/verification.

use('api');

// ============================================================
// USERS
// ============================================================

// Geospatial: nearby user discovery via $geoNear
db.users.createIndex({ location: '2dsphere' });

// Unique: login lookup (already created by Mongoose unique: true)
// db.users.createIndex({ email: 1 }, { unique: true });

// Compound: preference filtering (equality first, then range)
db.users.createIndex({ gender: 1, dateOfBirth: 1 });

// Text: full-text search across bio and interests
db.users.createIndex({ bio: 'text', interests: 'text' });

// Sort: popularity ranking
db.users.createIndex({ profileScore: -1 });

// Role lookup (from boilerplate)
db.users.createIndex({ 'role._id': 1 });

// ============================================================
// INTERACTIONS
// ============================================================

// Unique compound: prevent duplicate swipes at DB level
db.interactions.createIndex(
  { fromUser: 1, toUser: 1 },
  { unique: true },
);

// "Who liked me" queries
db.interactions.createIndex({ toUser: 1, action: 1 });

// TTL: auto-cleanup of old interactions after 90 days
db.interactions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 },
);

// ============================================================
// MATCHES
// ============================================================

// Find matches for a user (multikey index on array field)
db.matches.createIndex({ users: 1 });

// Sort by recency
db.matches.createIndex({ matchedAt: -1 });

// ============================================================
// MESSAGES
// ============================================================

// Chat history pagination — covers both filter (matchId) and sort (createdAt)
db.messages.createIndex({ matchId: 1, createdAt: 1 });

// User's sent messages
db.messages.createIndex({ senderId: 1, createdAt: -1 });

// ============================================================
// SESSIONS
// ============================================================

// User session lookup
db.sessions.createIndex({ user: 1 });

print('All indexes created successfully.');
print('Run db.collection.getIndexes() to verify.');
