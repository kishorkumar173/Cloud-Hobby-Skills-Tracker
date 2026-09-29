# Cloud Architecture & System Design

## 1. High-Level Architecture Overview

The **Online Hobby & Skills Tracker with Community Sharing on Cloud** is designed following the **Decoupled 3-Tier Cloud Native Architecture Pattern**:

```
                       +----------------------------------+
                       |           End Users              |
                       | (Laptops, Tablets, Smartphones)  |
                       +-----------------+----------------+
                                         | HTTPS (TLS 1.3)
                                         v
                       +----------------------------------+
                       |    Cloudflare CDN / Edge Cache   |
                       +-----------------+----------------+
                                         |
                  +----------------------+----------------------+
                  |                                             |
                  v                                             v
    +---------------------------+                 +---------------------------+
    |     Vite + React SPA      |                 |    Cloud API Gateway      |
    |  (Static Web App Storage) |                 | (Reverse Proxy / Routing) |
    +---------------------------+                 +-------------+-------------+
                                                                |
                                                                v
                                                  +---------------------------+
                                                  | FastAPI Backend Services  |
                                                  |   (Container / Run)       |
                                                  +-------------+-------------+
                                                                |
         +------------------------------------------------------+---------------------------------+
         |                                                      |                                 |
         v                                                      v                                 v
+------------------+                                  +-------------------+              +------------------+
| Cloud Auth / IAM |                                  | Cloud Relational  |              |   Cloud Object   |
|   (JWT / OAuth2) |                                  |  Database (RDBMS) |              |  Storage (S3 /   |
|                  |                                  | (Cloud SQL / PG)  |              | Supabase / Local)|
+------------------+                                  +-------------------+              +------------------+
         |                                                      |                                 |
         | User Claims                                          | Normalized Entities             | Media / Proof
         v                                                      v                                 v
+------------------+                                  +-------------------+              +------------------+
| Stateful Session |                                  |  8 Entity Tables  |              | Signed URLs &    |
|   Verification   |                                  | (Users, Skills,   |              | Key Hierarchies  |
|                  |                                  | Sessions, Feed)   |              |                  |
+------------------+                                  +-------------------+              +------------------+
```

---

## 2. Component Breakdown

### 2.1 Presentation Tier (Frontend Client)
- **Framework**: React 18 + Vite (SPA)
- **Styling**: Modern Tailwind-compatible Glassmorphism CSS with vibrant category gradients.
- **State Management**: React Context (`AuthContext`) handling token persistence, profile state, and session auto-restoration.
- **Networking**: Asynchronous `fetch` client with interceptors for `Authorization: Bearer <token>` injection and unified error unwrapping.

### 2.2 Application Tier (Backend Microservice)
- **Framework**: Python 3.11+ / FastAPI
- **Protocol**: RESTful HTTP/JSON with OpenAPI v3 Swagger autogeneration.
- **Middleware**:
  - CORS middleware allowing cross-origin requests from authenticated client domains.
  - JWT Bearer authentication middleware decoding token claims (`user_id`, `role`, `exp`).
  - Static file server mounting cloud object storage buckets.
- **Services Engine**:
  - `StreakService`: Computes consecutive calendar active days.
  - `GoalProgressService`: Synchronizes practice hours, computes progress percentages, and auto-unlocks milestones.
  - `ContentModerationService`: Implements XSS tag stripping and profanity filtering.
  - `ProgressAnalyticsService`: Aggregates weekly trends, skill distribution, and gamified badges.

### 2.3 Persistence Tier (Cloud Database & Storage)
- **Database Engine**: SQLAlchemy 2.0 ORM with multi-dialect support (SQLite for local rapid testing, PostgreSQL / Google Cloud SQL / Supabase for enterprise deployment).
- **Cloud Object Storage Provider**:
  - Local simulated S3/Blob storage with directory tree `users/{user_id}/{category}/{uuid}.ext`.
  - AWS S3 or Supabase Storage adapters with pre-signed URL capabilities for secure private asset delivery.

---

## 3. Entity-Relationship (ER) Schema Design

```
+---------------------------------------------------------------------------------+
|                                 DATABASE SCHEMA                                 |
+---------------------------------------------------------------------------------+

  +-------------------+       1:N       +-----------------------+
  |       USERS       |----------------<|        SKILLS         |
  +-------------------+                 +-----------------------+
  | PK  user_id       |                 | PK  skill_id          |
  |     name          |                 | FK  user_id           |
  |     username (UQ) |                 |     skill_name        |
  |     email (UQ)    |                 |     category          |
  |     password_hash |                 |     current_level     |
  |     profile_pic   |                 |     target_level      |
  |     bio           |                 |     status            |
  |     interests     |                 |     created_at        |
  |     role          |                 +-----------+-----------+
  |     created_at    |                             |
  +---------+---------+                             | 1:N
            |                                       v
            | 1:N                       +-----------------------+
            +--------------------------<|         GOALS         |
            |                           +-----------------------+
            |                           | PK  goal_id           |
            |                           | FK  user_id           |
            |                           | FK  skill_id          |
            |                           |     title             |
            |                           |     target_value      |
            |                           |     current_value     |
            |                           |     unit              |
            |                           |     deadline          |
            |                           |     status            |
            |                           +-----------+-----------+
            |                                       | 1:N
            |                                       v
            |                           +-----------------------+
            |                           |      MILESTONES       |
            |                           +-----------------------+
            |                           | PK  milestone_id      |
            |                           | FK  goal_id           |
            |                           |     title             |
            |                           |     target_value      |
            |                           |     achieved (bool)   |
            |                           |     achieved_at       |
            |                           +-----------------------+
            | 1:N
            +--------------------------<+-----------------------+
            |                           |   PRACTICE_SESSIONS   |
            |                           +-----------------------+
            |                           | PK  session_id        |
            |                           | FK  user_id           |
            |                           | FK  skill_id          |
            |                           |     duration_minutes  |
            |                           |     activity          |
            |                           |     notes             |
            |                           |     practiced_at      |
            |                           +-----------------------+
            | 1:N
            +--------------------------<+-----------------------+
            |                           |         POSTS         |
            |                           +-----------------------+
            |                           | PK  post_id           |
            |                           | FK  user_id           |
            |                           | FK  skill_id (opt)    |
            |                           |     content           |
            |                           |     media_url         |
            |                           |     created_at        |
            |                           +-----------+-----------+
            |                                       |
            | 1:N                                   | 1:N
            +-------+-------------------------------+-------+
            |       |                               |       |
            v       v                               v       v
   +------------+ +------------+          +------------+ +------------+
   |   LIKES    | |  COMMENTS  |          |   LIKES    | |  COMMENTS  |
   +------------+ +------------+          +------------+ +------------+
   | PK like_id | |PK comment_id          | PK like_id | |PK comment_id
   | FK user_id | |FK user_id  |          | FK post_id | |FK post_id  |
   | FK post_id | |FK post_id  |          +------------+ +------------+
   +------------+ |   content  |
                  |   created_at
                  +------------+
```

---

## 4. Cloud Data Flow Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Learner (Browser)
    participant Auth as Auth / JWT Service
    participant API as FastAPI Cloud Backend
    participant Storage as Cloud Object Storage
    participant DB as Cloud Database (RDBMS)
    participant Feed as Community Engine

    %% Registration & Authentication
    User->>Auth: POST /api/register (name, username, password)
    Auth->>DB: Check uniqueness & hash password (bcrypt)
    DB-->>Auth: User record created
    Auth-->>User: JWT Bearer Token (claims: user_id, role)

    %% Skill & Goal Creation
    User->>API: POST /api/skills (Guitar, Music, Beginner)
    API->>DB: INSERT into skills
    DB-->>API: skill_id: 1
    User->>API: POST /api/goals (30 Hours target)
    API->>DB: INSERT goal & 4 auto milestones (25%, 50%, 75%, 100%)

    %% Logging Practice & Auto-Sync
    User->>API: POST /api/practice (skill_id: 1, duration: 60m)
    API->>DB: INSERT practice_session
    API->>DB: SELECT active goals matching skill_id
    API->>DB: UPDATE goal.current_value += 1.0 hr
    API->>DB: Check & UPDATE milestones.achieved = True
    API->>DB: Query dates to recompute streak count
    DB-->>API: Updated telemetry & streak = 7
    API-->>User: Confirmation + Gamified Badge Check

    %% Image Upload & Community Sharing
    User->>API: POST /api/files/upload (achievement.png)
    API->>Storage: Validate MIME & put_object(users/1/posts/xyz.png)
    Storage-->>API: Signed / Public URL
    API->>DB: INSERT into storage_files
    API-->>User: media_url returned
    User->>Feed: POST /api/posts (content, media_url, skill_id)
    Feed->>DB: Moderate & INSERT into posts
    Feed-->>User: post_id created

    %% Community Interactions
    actor Peer as Community Peer
    Peer->>Feed: GET /api/feed?sort_by=popular
    DB-->>Feed: Query posts with aggregated likes & comment counts
    Feed-->>Peer: Render rich interactive cards
    Peer->>Feed: POST /api/posts/{id}/like
    Feed->>DB: Idempotent INSERT into likes
    Feed-->>Peer: Live heart toggle & count +1
```
