# Technical Interview Preparation Guide

This guide prepares you to articulate your project with authority during cloud computing, software engineering, and full-stack placement interviews.

---

### Q1: Explain your project.
**Sample Answer:**
> "I built an **Online Hobby & Skills Tracker with Community Sharing on Cloud** titled **SkillPulse**.
> 
> The core problem it solves is the lack of structure and social accountability that causes most self-learners to drop new hobbies like music, coding, or fitness.
> 
> Architecturally, it is a cloud-native full-stack application featuring a decoupled **React 18 SPA** on the presentation layer, an asynchronous **Python FastAPI microservice** in the application tier, and an enterprise **Cloud Persistence layer** utilizing SQLAlchemy relational mapping and Cloud Object Storage for media assets.
> 
> The application allows users to set progressive learning goals, record daily practice sessions, calculate consecutive habit streaks, automatically unlock milestones, upload image proof into cloud object storage, and share updates into an interactive community feed featuring idempotent likes and moderated comments.
> 
> Beyond basic CRUD, this project was architected specifically to demonstrate real-world **Cloud Computing concepts**: stateless JWT authentication, multi-tenant database isolation, signed URLs for private objects, health check liveness probes, automated CI testing, and containerized deployment with Docker."

---

### Q2: Why did you separate database storage from cloud object storage instead of storing images directly in the database?
**Sample Answer:**
> "Storing binary files directly in relational databases as BLOBs is an anti-pattern in cloud computing. RDBMS engines are optimized for structured rows, indexing, and transactional ACID queries. Storing multi-megabyte binary data bloats database backups, degrades caching efficiency, inflates memory footprints, and saturates database connection bandwidth.
> 
> Instead, I implemented the standard **Cloud Object Storage Pattern**: the database stores only lightweight metadata (`file_id`, `storage_path`, `file_size`, `mime_type`), while the actual binary images are stored in a cloud object store (like AWS S3 or Supabase Storage) under structured key prefixes like `users/{user_id}/posts/{uuid}.jpg`. This allows images to be served directly via CDNs or signed URLs, offloading media bandwidth entirely from the database and application servers."

---

### Q3: How does your authentication and authorization system work?
**Sample Answer:**
> "I implemented a stateless token-based authentication mechanism using **JSON Web Tokens (JWT)** and **bcrypt** password hashing.
> 
> When a user registers or logs in, their password is verified against the bcrypt salted hash. The backend issues a cryptographically signed JWT containing claims such as `user_id`, `role`, and expiration timestamp (`exp`). The client stores this in browser storage and attaches it as a Bearer token in the HTTP `Authorization` header.
> 
> For authorization, my FastAPI middleware intercepts incoming requests, decodes and verifies the signature using our HMAC-SHA256 secret key, and injects the authenticated `current_user` dependency. Every database query strictly filters by `user_id == current_user.user_id`, guaranteeing multi-tenant data isolation. For social features, we enforce Role-Based Access Control where standard users can only delete their own content, while users with the `moderator` role can remove flagged posts across the community."

---

### Q4: How is your practice streak calculated, and how does the system maintain accuracy?
**Sample Answer:**
> "Streak calculation is handled in `backend/services/streak_service.py`. Rather than relying on simple increments that can be gamed or desynchronized, the service queries all practice sessions for the user and extracts unique calendar dates sorted in chronological order.
> 
> It checks whether the user's latest recorded practice was either today or yesterday. If the last practice was older than yesterday, the active streak resets to 0. Otherwise, the algorithm traverses backwards day-by-day, counting consecutive active calendar days. It also calculates the user's all-time longest streak by computing the maximum consecutive delta across their entire practice history."

---

### Q5: How do goals and milestones automatically synchronize when a practice session is logged?
**Sample Answer:**
> "Whenever a user logs a practice session via `POST /api/practice`, the request enters an atomic database transaction.
> 
> After recording the practice session, `GoalProgressService` queries all active goals associated with that specific `skill_id`. If the goal unit is measured in hours, the goal's `current_value` is incremented by `duration_minutes / 60.0`.
> 
> The service then iterates through the goal's milestone checkpoints. If `current_value >= milestone.target_value` and the milestone has not been marked as achieved, the service updates `milestone.achieved = True` and sets `achieved_at = utcnow()`. If all target hours are met, the goal status automatically updates to `COMPLETED`. This demonstrates reactive state updates in cloud backends."

---

### Q6: How do you prevent duplicate likes when multiple network requests are sent concurrently?
**Sample Answer:**
> "I addressed this using both database constraints and service idempotency.
> 
> In the database, the `likes` table has a composite unique constraint: `UniqueConstraint('post_id', 'user_id', name='uq_post_user_like')`. This guarantees at the database storage engine level that duplicate pairs cannot exist.
> 
> In the API route `POST /api/posts/{id}/like`, the backend first performs a check for an existing like. If found, it returns the current state with `is_liked: true` without failing or attempting a duplicate insertion. This ensures the endpoint is fully idempotent."

---

### Q7: What are pre-signed URLs, and how did you implement them in this project?
**Sample Answer:**
> "Pre-signed URLs are time-limited, cryptographically signed web addresses that allow clients to read or upload specific objects in a private cloud storage bucket without needing direct cloud account credentials.
> 
> In my `cloud/storage_service.py`, I implemented pre-signed URL generation. The backend takes the private object key (e.g., `users/1/skills/certificate.pdf`) and an expiration timestamp (e.g., 1 hour), and creates an HMAC-SHA256 signature using the application secret key. When a client requests the signed URL, the server verifies the signature and expiration before streaming the file. This ensures sensitive learning evidence is never made permanently public to web crawlers."

---

### Q8: How would you scale the community feed if the platform grew to 1,000,000 active users?
**Sample Answer:**
> "Currently, the platform uses **Fan-out on Read**, where a single SQL query joins posts, authors, and likes when the feed is requested. This works efficiently for up to tens of thousands of users.
> 
> To scale to 1,000,000 users, I would transition to a hybrid **Fan-out on Write** architecture:
> 1. Use **Redis Sorted Sets** to store pre-computed timeline feeds for each user.
> 2. When a creator publishes a post, an event is placed onto a message queue (such as **AWS SQS** or **RabbitMQ**).
> 3. Background worker microservices pull from the queue and push the post ID into the Redis timelines of all followers.
> 4. For accounts with millions of followers (the 'celebrity problem'), we use Fan-out on Read dynamically for those specific creators to prevent worker queue congestion."

---

### Q9: What security measures did you implement against Cross-Site Scripting (XSS) and injection attacks?
**Sample Answer:**
> "We applied defense-in-depth:
> 1. **XSS Prevention**: In `moderation_service.py`, all user-submitted text for posts and comments is sanitized using regex patterns that strip raw HTML tags, script blocks, and JavaScript event attributes. Furthermore, React automatically escapes variables during JSX rendering.
> 2. **SQL Injection Prevention**: All database interactions use SQLAlchemy ORM with parameterized query bindings, completely eliminating raw SQL string concatenation.
> 3. **Input Validation**: Pydantic models strictly validate types, string length bounds, and formats before payloads ever reach service logic.
> 4. **File Safety**: File uploads are checked against an extension whitelist and prohibited executable MIME types."

---

### Q10: How does your containerization and cloud deployment pipeline work?
**Sample Answer:**
> "I created a **multi-stage Dockerfile**:
> - Stage 1 uses a `node:20-alpine` base image to install frontend dependencies and build the optimized production assets with Vite.
> - Stage 2 uses a slim `python:3.11-slim` runtime image, installs backend requirements, copies the compiled frontend assets, and exposes the app via Uvicorn.
> 
> This multi-stage strategy keeps the production container lightweight and secure, containing no Node.js runtime or dev dependencies in the final image. The container can be deployed to any cloud provider — AWS App Runner, ECS, Google Cloud Run, or Render — ensuring complete environment parity between development and production."
