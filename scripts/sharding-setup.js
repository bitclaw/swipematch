// ============================================================
// SwipeMatch — Sharding Strategy
// ============================================================
// This script is for reference/discussion. Sharding requires a
// sharded cluster (mongos + config servers + shard replica sets),
// not a standalone replica set.
//
// Run against mongos:
//   mongosh --host mongos:27017 < scripts/sharding-setup.js

// Enable sharding on the database
sh.enableSharding('api');

// ============================================================
// 1. USERS COLLECTION
// ============================================================
// Shard key: { location: "hashed" }
//
// Why this key:
//   - Dating queries are fundamentally location-based
//   - Hashed provides even distribution across shards
//   - High cardinality (every user has unique coordinates)
//
// Trade-off:
//   - Range queries on location become scatter-gather
//   - Acceptable because $geoNear already limits by maxDistance
//
// Alternatives considered:
//   - { _id: "hashed" } — simpler but doesn't align with query patterns
//   - { country: 1, _id: "hashed" } — compound key for geographic locality,
//     but low cardinality on country alone can cause hot shards
//
// Anti-patterns avoided:
//   - { gender: 1 } — cardinality of 2-4, massive hot shards
//   - { createdAt: 1 } — monotonically increasing, all writes hit one shard
//   - { status: 1 } — low cardinality (active/inactive)

sh.shardCollection('api.users', { location: 'hashed' });

// ============================================================
// 2. INTERACTIONS COLLECTION (highest write volume)
// ============================================================
// Shard key: { fromUser: "hashed" }
//
// Why this key:
//   - Primary query: "what has this user swiped on" → targets single shard
//   - High cardinality (millions of users)
//   - Hashed prevents hotspots from power users who swipe frequently
//   - Write distribution is even across all shards
//
// Trade-off:
//   - "Who liked me" queries (by toUser) become scatter-gather
//   - Acceptable because likes-received is a less frequent read path
//
// Alternative considered:
//   - { fromUser: 1, toUser: 1 } — compound key gives targeted lookups
//     for both directions, but range queries on fromUser become broadcast

sh.shardCollection('api.interactions', { fromUser: 'hashed' });

// ============================================================
// 3. MESSAGES COLLECTION (unbounded growth)
// ============================================================
// Shard key: { matchId: "hashed" }
//
// Why this key:
//   - All messages for a conversation share the same matchId
//   - Chat history query { matchId, createdAt } hits a single shard
//   - Hashed prevents hotspot from very active conversations
//   - Data locality: entire conversation on one shard
//
// Trade-off:
//   - "All messages by user X" requires scatter-gather
//   - Acceptable because that query is analytics-only, not user-facing

sh.shardCollection('api.messages', { matchId: 'hashed' });

// ============================================================
// 4. MATCHES COLLECTION (small, slow-growing)
// ============================================================
// Shard key: { _id: "hashed" }
//
// Why this key:
//   - Relatively small collection (only mutual likes become matches)
//   - No dominant query pattern justifies a field-based shard key
//   - _id gives best write distribution for a general-purpose key
//
// Note: Array fields (like 'users') cannot be used as shard keys.
// The { users: 1 } index still works for queries within each shard.

sh.shardCollection('api.matches', { _id: 'hashed' });

// ============================================================
// CHUNK MANAGEMENT
// ============================================================
// The balancer automatically migrates chunks for even distribution.
// For interactions (highest volume), ensure balancing is enabled:

sh.enableBalancing('api.interactions');

// Pre-splitting can help avoid initial chunk migration storms:
// sh.splitAt("api.interactions", { fromUser: <midpoint_hash> });

// ============================================================
// ZONE-BASED SHARDING (geographic locality)
// ============================================================
// For global deployments, use zones to keep data near users:
//
// sh.addShardTag("shard-us-west", "US-WEST");
// sh.addShardTag("shard-us-east", "US-EAST");
// sh.addShardTag("shard-eu", "EU");
//
// sh.addTagRange(
//   "api.users",
//   { location: MinKey },
//   { location: <us_west_hash_boundary> },
//   "US-WEST"
// );
//
// This ensures users in US-WEST are primarily stored on the
// US-WEST shard, reducing read latency for discovery queries.

// ============================================================
// VERIFICATION
// ============================================================
// After setup, verify with:
//   sh.status()                    — cluster overview
//   db.users.getShardDistribution() — chunk distribution per collection
//   db.interactions.getShardDistribution()

print('Sharding configuration applied.');
print('Run sh.status() to verify.');
