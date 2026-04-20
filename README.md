# SwipeMatch API

A dating app backend built with **NestJS**, **MongoDB**, **TypeScript**, and **Docker**. This project demonstrates
production-grade backend patterns including MongoDB sharding, indexing strategies, aggregation pipelines, and replica
set configuration, all in the context of a real-world dating application.

Built on top of the [NestJS Boilerplate](https://github.com/brocoders/nestjs-boilerplate) by Brocoders.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Backend Features](#backend-features)
- [MongoDB Deep Dive](#mongodb-deep-dive)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Makefile Commands](#makefile-commands)
- [Testing Strategy](#testing-strategy)
- [AWS Integration Points](#aws-integration-points)
- [Interview Reference](#interview-reference)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5.9 |
| Database | MongoDB 8.2 (Mongoose ODM) |
| Caching | Redis 7 |
| Auth | JWT (access + refresh tokens), OAuth (Google, Facebook, Apple) |
| File Storage | S3 / Local |
| Containerization | Docker + Docker Compose |
| Testing | Jest, Supertest, mongodb-memory-server |
| Documentation | Swagger / OpenAPI |

## Architecture Overview

The project follows a **layered architecture** with clear separation of concerns:

```
src/
├── auth/                    # JWT authentication, OAuth providers
├── users/                   # User profiles, preferences, location
├── interactions/            # Swipe actions (like, pass, superlike)
├── matches/                 # Mutual match management
├── messages/                # Chat between matched users
├── discovery/               # Nearby user search (geospatial)
├── analytics/               # Aggregation-based metrics
├── database/                # MongoDB config, seeds, index scripts
├── files/                   # S3/local file upload handling
├── common/                  # Shared guards, pipes, filters, interceptors
└── config/                  # Environment configuration
```

Each domain module follows the pattern:

```
module/
├── domain/                  # Plain domain entity (framework-agnostic)
├── infrastructure/
│   └── persistence/
│       └── document/
│           ├── entities/    # Mongoose schema definition
│           ├── mappers/     # Domain <-> Persistence mapping
│           └── repositories/# Data access layer
├── dto/                     # Request/response validation (class-validator)
├── *.controller.ts          # REST endpoint definitions
├── *.service.ts             # Business logic
└── *.module.ts              # NestJS dependency wiring
```

## Backend Features

### User Profiles
- CRUD operations for dating profiles
- GeoJSON location storage for proximity searches
- Preference management (gender, age range, max distance)
- Profile photo metadata (S3 integration)
- Text-searchable bio and interests

### Discovery Engine
- **Geospatial search** using MongoDB `$geoNear` aggregation
- Filter by gender preference, age range, and distance
- Excludes previously swiped users via `$lookup`
- Returns results sorted by proximity
- Paginated response with distance metadata

### Interactions (Swipe System)
- Record like, pass, and superlike actions
- **Mutual like detection** — automatically creates a match when both users like each other
- Duplicate swipe prevention via unique compound index
- View received likes (who liked me)

### Matches
- Automatic match creation on mutual likes
- List active matches sorted by last message time
- Unmatch functionality (soft delete)
- Cross-module event: interaction triggers match check

### Messaging
- Send messages within active matches only
- `MatchParticipantGuard` — ensures sender belongs to the match
- Paginated chat history per match
- Read receipts (mark as read with timestamp)
- Message types: text, image, gif

### Analytics Dashboard
- **Popular profiles** — top users by likes received in a time window
- **Engagement metrics** — DAU, swipes per user, like rate by day
- **Match conversion funnel** — swipes → likes → matches → conversations (using `$facet`)
- All computed via MongoDB aggregation pipelines (no application-level processing)

### NestJS Patterns Demonstrated
- **Guards** — `MatchParticipantGuard` (authorization), `RateLimitGuard` (abuse prevention)
- **Pipes** — `CoordinatesValidationPipe` (lat/lng validation and transformation)
- **Filters** — `MongoDBExceptionFilter` (duplicate key → 409, validation → 422)
- **Interceptors** — `LoggingInterceptor` (structured JSON, CloudWatch-compatible)
- **DTOs** — `class-validator` decorators (`@IsMongoId`, `@IsEnum`, `@IsNumber`)
- **Dependency Injection** — cross-module service injection (interactions → matches)

## MongoDB Deep Dive

### Schema Design Decisions

| Collection | Strategy | Rationale |
|-----------|----------|-----------|
| **users** | Preferences embedded in document | Always accessed together with profile; avoids joins |
| **interactions** | Lean documents, references users | Write-heavy (every swipe); minimal fields for performance |
| **matches** | Array of 2 user ObjectIds | Small collection (only mutual likes); simple lookup |
| **messages** | References match by ObjectId | Unbounded growth per match; separate collection prevents document size limits |
| **sessions** | TTL-indexed documents | Auto-expire without cron jobs |

### Index Strategy

```javascript
// --- Users ---
{ location: "2dsphere" }                          // Geospatial: nearby user discovery
{ email: 1 }                        /* unique */   // Login lookup
{ gender: 1, dateOfBirth: 1 }                      // Compound: preference filtering (equality first, then range)
{ bio: "text", interests: "text" }                 // Full-text: profile search
{ profileScore: -1 }                               // Sort: popularity ranking

// --- Interactions ---
{ fromUser: 1, toUser: 1 }         /* unique */   // Prevent duplicate swipes at DB level
{ toUser: 1, action: 1 }                           // "Who liked me" queries
{ createdAt: 1 }    /* TTL: 90 days */             // Auto-cleanup of old passes

// --- Matches ---
{ users: 1 }                                       // Find matches for a user
{ matchedAt: -1 }                                  // Sort by recency

// --- Messages ---
{ matchId: 1, createdAt: 1 }                       // Chat history pagination (covers filter + sort)
```

**Index design principles applied:**
- Compound indexes follow **equality → range → sort** ordering
- Unique indexes enforce business rules at the database level (no duplicate swipes)
- TTL indexes handle data lifecycle without application cron jobs
- Text indexes span multiple fields for unified search
- Every index is justified by a specific query pattern — no speculative indexes

### Aggregation Pipelines

**1. Discovery — Find Nearby Users**
```
$geoNear (2dsphere) → $addFields (calculate age) → $match (age filter)
  → $lookup (exclude swiped) → $project → $sort (distance) → $limit
```

**2. Popular Profiles**
```
$match (likes in timeframe) → $group (count by toUser)
  → $sort (desc) → $limit → $lookup (user data) → $unwind → $project
```

**3. Match Conversion Funnel** (uses `$facet` for single-pass multi-metric)
```
$facet {
  totalSwipes: [$count],
  likes: [$match + $count],
  passes: [$match + $count],
  matches: [$match + $lookup + $count],
  conversations: [$match + $lookup + $lookup + $count]
}
```

**4. Engagement Metrics**
```
$match (timeframe) → $group (by date, $addToSet for DAU)
  → $project (compute swipes/user, like rate) → $sort (date)
```

### Replication Set Configuration

The Docker Compose setup runs a **3-node MongoDB replica set**:

| Node | Port | Role |
|------|------|------|
| mongo1 | 27017 | Primary (priority: 2) |
| mongo2 | 27018 | Secondary |
| mongo3 | 27019 | Secondary |

**Configuration in application code:**
- `readPreference: 'secondaryPreferred'` — offloads reads from primary for a read-heavy dating app
- `writeConcern: { w: 'majority' }` — ensures data durability across nodes before acknowledging writes
- Automatic failover: if primary goes down, secondaries elect a new primary (~12 seconds)

### Sharding Strategy

Sharding configuration scripts with rationale for each collection:

| Collection | Shard Key | Why |
|-----------|----------|-----|
| **users** | `{ location: "hashed" }` | Aligns with geo query patterns; hashed for even distribution |
| **interactions** | `{ fromUser: "hashed" }` | "My swipes" queries target single shard; high cardinality |
| **messages** | `{ matchId: "hashed" }` | Conversation data locality — all messages for a chat on same shard |
| **matches** | `{ _id: "hashed" }` | Small collection; even write distribution |

**Anti-patterns avoided:**
- `gender` as shard key (cardinality of 2-3 → hot shards)
- `createdAt` as shard key (monotonically increasing → all writes to latest shard)
- `status` as shard key (low cardinality)

### When to Use MongoDB vs PostgreSQL

**Use MongoDB when:**
- Schema evolves frequently (different profile types, A/B testing new fields)
- Horizontal write scaling is needed (millions of concurrent swipes)
- Embedded documents reduce JOINs (profile + preferences in one read)
- Real-time analytics via aggregation pipelines
- Geospatial queries are a primary access pattern

**Use PostgreSQL when:**
- Complex multi-table transactions with referential integrity (payments, subscriptions)
- Advanced geospatial analysis (PostGIS is more mature)
- BI tool integration and complex analytical queries
- Strict schema enforcement is a priority

**Hybrid approach (common in production dating apps):**
- PostgreSQL: users (system of record), payments, subscriptions
- MongoDB: sessions, messages, interactions, activity feeds, recommendations

## API Endpoints

### Auth (from boilerplate)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/email/register` | Register with email |
| POST | `/api/v1/auth/email/login` | Login, receive JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate session |

### User Profiles
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/profile/:id` | View a user's profile |
| PATCH | `/api/v1/users/profile` | Update own profile (bio, location, preferences) |

### Discovery
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/discovery` | Find nearby users matching preferences |

### Interactions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/interactions` | Record a swipe (like/pass/superlike) |
| GET | `/api/v1/interactions/likes-received` | Users who liked me |

### Matches
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/matches` | List my matches (paginated) |
| DELETE | `/api/v1/matches/:id` | Unmatch |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/messages` | Send a message |
| GET | `/api/v1/messages/:matchId` | Chat history (paginated) |
| PATCH | `/api/v1/messages/:id/read` | Mark message as read |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics/popular-profiles` | Top profiles by likes received |
| GET | `/api/v1/analytics/engagement` | DAU, swipes/user, like rate |
| GET | `/api/v1/analytics/match-rate` | Conversion funnel |

## Getting Started

### Prerequisites

- Node.js >= 16
- Docker and Docker Compose
- npm >= 8

### Quick Start

```bash
# 1. Clone and enter the project
git clone https://github.com/bitclaw/swipematch.git
cd swipematch

# 2. Set up environment
make env.setup

# 3. Start MongoDB, Mongo Express, and API via Docker
make start

# 4. (Alternative) Run locally with Docker only for MongoDB
make start.detach       # Start MongoDB in background
make install            # Install npm dependencies
make db.seed            # Seed initial data
make dev                # Start NestJS in watch mode

# 5. Access the app
# API:           http://localhost:3000
# Swagger docs:  http://localhost:3000/docs
# Mongo Express: http://localhost:8081
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make env.setup` | Copy env-example-document to .env |
| `make install` | Install npm dependencies |
| `make build` | Build Docker images |
| `make start` | Start all services (attached) |
| `make start.detach` | Start all services (background) |
| `make stop` | Stop all services |
| `make restart` | Restart all services |
| `make dev` | Start NestJS in watch mode (local) |
| `make dev.swc` | Start NestJS with SWC compiler (faster) |
| `make debug` | Start NestJS in debug mode |
| `make sh` | Shell into API container |
| `make mongo.sh` | Open MongoDB shell |
| `make db.seed` | Run database seeds (local) |
| `make db.seed.docker` | Run database seeds (Docker) |
| `make db.indexes` | List all indexes in the database |
| `make test` | Run unit tests |
| `make test.watch` | Run tests in watch mode |
| `make test.cov` | Run tests with coverage |
| `make test.e2e` | Run E2E tests (local) |
| `make test.e2e.docker` | Run E2E tests in Docker |
| `make lint` | Run ESLint |
| `make lint.fix` | Run ESLint with auto-fix |
| `make format` | Run Prettier |
| `make generate.resource` | Generate a new NestJS resource |
| `make logs` | Tail all service logs |
| `make logs.api` | Tail API logs |
| `make logs.mongo` | Tail MongoDB logs |
| `make ps` | List running containers |
| `make clean` | Stop services and remove volumes |

## Testing Strategy

### Unit Tests
- Service layer tests with mocked repositories
- Controller tests for request validation and guard behavior
- Custom filter/guard/pipe tests
- Run with: `make test`

### Integration Tests
- Aggregation pipeline correctness with `mongodb-memory-server` (replica set mode)
- Geospatial query accuracy with known coordinate datasets
- Run with: `make test.e2e`

### Key Test Scenarios
- Mutual like detection creates a match
- Self-interaction is rejected
- Duplicate swipe returns appropriate error
- `$geoNear` returns users within specified radius, sorted by distance
- `$geoNear` excludes already-swiped users
- Analytics pipelines produce correct metrics from seeded data
- `MatchParticipantGuard` blocks messages from non-participants
- Rate limit guard throttles excessive swipes

## AWS Integration Points

| Service | Use Case | Implementation |
|---------|----------|---------------|
| **S3** | Profile photo storage | Boilerplate's file module with `profiles/{userId}/{uuid}.jpg` key pattern |
| **ElastiCache (Redis)** | Cache discovery results (5 min TTL), match lists (1 min TTL) | `@nestjs/cache-manager` with Redis store |
| **CloudWatch** | Structured JSON logging | `LoggingInterceptor` outputs request timing, method, status |
| **EC2/ECS** | Container deployment | Docker Compose translates to ECS task definitions |
| **Lambda** | Photo processing (resize, moderation) | Triggered by S3 upload events |

## Interview Reference

This project was built to demonstrate practical knowledge of the following topics in a real-world context:

### MongoDB
- **Schema design** — embedding vs referencing, document modeling for different access patterns
- **Indexes** — single field, compound, 2dsphere, text, TTL, unique; index selection trade-offs
- **Aggregation** — `$geoNear`, `$lookup`, `$group`, `$facet`, `$addFields`, pipeline optimization
- **Replication** — replica sets, read preferences, write concerns, automatic failover
- **Sharding** — shard key selection, hashed vs range, cardinality, query isolation
- **When to use / not use** — MongoDB vs PostgreSQL trade-offs, hybrid architectures

### NestJS / Node.js
- Modular architecture with dependency injection
- Guards, pipes, filters, interceptors
- DTOs with class-validator
- Cross-module service injection
- Layered persistence (domain entity → schema → mapper → repository)

### Docker
- Multi-service Docker Compose (API, MongoDB replica set, Redis, mail)
- Development workflow with hot reload
- E2E testing in containers

### Testing
- Unit tests with Jest and `@nestjs/testing`
- Integration tests with real MongoDB (memory server)
- Testing aggregation pipeline correctness

## License

MIT

## Credits

Built on top of [NestJS Boilerplate](https://github.com/brocoders/nestjs-boilerplate) by [Brocoders](https://brocoders.com/).
