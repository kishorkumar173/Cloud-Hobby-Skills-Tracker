# Scalability, Feed Architecture & Failure Handling

## 1. Scalability Growth Roadmap

```
+----------------------------------------------------------------------------------------------------+
|                                      SCALABILITY ROADMAP                                           |
+----------------------------------------------------------------------------------------------------+
| 10 USERS          | Single container (FastAPI + SQLite), local uploads folder.                     |
|                   | Suitable for local development, demoing, and integration testing.              |
+-------------------+--------------------------------------------------------------------------------+
| 1,000 USERS       | Managed PostgreSQL (Supabase/RDS), S3/Cloud Storage, Render PaaS.              |
|                   | Database connection pooling enabled (10-20 connections).                       |
+-------------------+--------------------------------------------------------------------------------+
| 100,000 USERS     | Horizontal auto-scaling (ECS Fargate / Cloud Run), Redis Cache for feed/streak,|
|                   | Read Replicas for database, CloudFront CDN for static and media assets.        |
+-------------------+--------------------------------------------------------------------------------+
| 1,000,000+ POSTS  | Sharded database / Partitioned tables by date, asynchronous Celery / SQS tasks |
|                   | for milestone processing, hybrid Fan-out feed architecture.                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Community Feed Generation: Fan-out on Read vs. Fan-out on Write

At massive scale, generating social feeds becomes one of the most resource-intensive operations in cloud computing.

### 2.1 Fan-out on Read (Current Implementation - Ideal for <100k Users)
- **Mechanism**: When User B requests `/api/feed`, the backend runs a single SQL query joining `posts`, `users`, `likes`, and `comments` with sorting by `created_at` or `like_count`.
- **Pros**:
  - Very simple to implement.
  - Zero background processing required when a user publishes a post.
  - New posts appear in the global feed instantly.
- **Cons**:
  - Read query latency increases as post volume grows into millions.
  - Database CPU spikes during high concurrent user reading traffic.

### 2.2 Fan-out on Write (Enterprise Social Pattern - Ideal for >100k Users)
- **Mechanism**: Every user maintains a dedicated pre-computed timeline in an in-memory cache (Redis Sorted Set). When User A publishes a post, a background cloud worker (AWS SQS + Lambda) pushes that post ID into the timelines of all User A's followers.
- **Pros**:
  - Reading the feed is lightning fast ($O(1)$ cache retrieval).
  - Primary database read load is reduced by 95%.
- **Cons**:
  - High storage footprint in cache.
  - "Celebrity Problem": If an athlete with 500,000 followers posts, pushing that post ID to 500,000 timelines causes temporary queue congestion.

---

## 3. Cloud Failure Handling & Resilience Patterns

### 3.1 Scenario Matrix

| Failure Mode | Risk | Resilience Strategy Implemented |
|---|---|---|
| **Database Connection Failure** | Data loss or 500 errors | Engine pre-pinging (`pool_pre_ping=True`) automatically re-establishes broken pooled connections; health probes notify orchestrator. |
| **Storage Upload Interruption** | Incomplete byte streams | Atomic file operations: files are validated in memory before writing to disk/S3; temporary scratch files purged on failure. |
| **Partial Transaction Failure** | Image uploads but DB fails | File upload occurs first; if subsequent DB write fails, database `rollback()` executes and file deletion cleanup is triggered. |
| **Duplicate Requests (Network Flap)** | Duplicate likes / sessions | Database-level unique constraint (`uq_post_user_like`) guarantees idempotency; repeat requests return existing state gracefully. |
| **JWT Expiration Mid-Session** | Unexpected 401 errors | Frontend `client.js` intercepts 401 responses, removes expired local credentials, and presents the user with an intuitive re-login screen. |
| **Network Timeout** | Client UI freeze | Fetch requests include strict timeouts and catch blocks, displaying friendly contextual toasts rather than white-screens. |

---

## 4. Idempotency Implementation

Idempotency ensures that performing the same operation multiple times produces the identical side-effect as running it once.

In this project, liking a post is strictly idempotent:
```python
existing_like = db.query(Like).filter(
    Like.post_id == post_id,
    Like.user_id == current_user.user_id
).first()

if existing_like:
    return success_response(
        data={"post_id": post_id, "likes_count": len(post.likes), "is_liked": True},
        message="Post was already liked"
    )
```
Even if a user's mobile client sends 10 duplicate like requests over a lagging cell network, only 1 like row is ever stored.
