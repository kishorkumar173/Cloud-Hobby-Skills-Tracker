# Cloud Deployment Guide

This guide covers two distinct deployment pathways:
1. **Approach A (Student-Friendly / Free-Tier)**: Zero-cost deployment using modern managed PaaS platforms.
2. **Approach B (Enterprise Multi-Cloud)**: Production AWS/GCP/Azure architecture for large-scale production.

---

## APPROACH A: Student-Friendly Free-Tier Deployment

```
   +--------------------+              +--------------------+
   |   Vercel / Netlify |              |    Render.com /    |
   |   (React Frontend) |              |  Koyeb (FastAPI)   |
   +---------+----------+              +---------+----------+
             |                                   |
             | HTTPS API Requests                |
             +----------------->-----------------+
                                                 |
                               +-----------------+-----------------+
                               |                                   |
                               v                                   v
                     +-------------------+               +-------------------+
                     | Supabase / Neon   |               | Supabase Storage  |
                     |  (PostgreSQL DB)  |               |  (Cloud Bucket)   |
                     +-------------------+               +-------------------+
```

### Step 1: Database Setup on Supabase or Neon (PostgreSQL)
1. Sign up for a free account at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Create a new project titled `hobby-skills-cloud-db`.
3. In Database Settings, copy the Connection String:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. In Supabase Storage, create a public bucket named `hobby-media`.

### Step 2: Backend Deployment on Render.com
1. Fork or push your repository `Cloud-Hobby-Skills-Tracker` to GitHub.
2. Log into [Render](https://render.com) and click **New + → Web Service**.
3. Connect your repository.
4. Set the following build and run options:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables in the Render dashboard:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = `<your-supabase-connection-string>`
   - `SECRET_KEY` = `<strong-random-secret-key>`
   - `STORAGE_PROVIDER` = `local` (or `supabase` with bucket URL)
   - `CORS_ORIGINS` = `*` (or your Vercel frontend URL)
6. Click **Deploy Web Service**. Render will output a live HTTPS URL:
   `https://hobby-skills-tracker-api.onrender.com`.

### Step 3: Frontend Deployment on Vercel
1. Log into [Vercel](https://vercel.com) and click **Add New → Project**.
2. Select your repository and configure root directory to `frontend`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL` = `https://hobby-skills-tracker-api.onrender.com`
4. Click **Deploy**. Within 60 seconds, your application is live on a global CDN:
   `https://hobby-skills-tracker.vercel.app`.

---

## APPROACH B: Enterprise AWS Cloud Architecture

```
                                  [ End Users ]
                                        │
                                        ▼ HTTPS (Route 53)
                            ┌───────────────────────┐
                            │    AWS CloudFront     │
                            │      (Global CDN)     │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
       ┌────────────────────────┐              ┌────────────────────────┐
       │   Amazon S3 Bucket     │              │  Amazon API Gateway    │
       │ (Static React Web SPA) │              └────────────┬───────────┘
       └────────────────────────┘                           │
                                                            ▼
                                               ┌────────────────────────┐
                                               │ AWS App Runner / ECS   │
                                               │ (FastAPI Docker Tasks) │
                                               └────────────┬───────────┘
                                                            │
                       ┌────────────────────────────────────┴────────────────────────────────────┐
                       │                                    │                                    │
                       ▼                                    ▼                                    ▼
          ┌────────────────────────┐           ┌────────────────────────┐           ┌────────────────────────┐
          │     AWS Cognito        │           │    Amazon RDS for      │           │    Amazon S3 Bucket    │
          │ (User Pools & Identity)│           │   PostgreSQL (Multi-AZ)│           │   (Private User Media) │
          └────────────────────────┘           └────────────────────────┘           └────────────────────────┘
```

### AWS Implementation Steps
1. **Frontend Distribution**:
   - Build React app: `npm run build`.
   - Upload `dist/` directory to Amazon S3 Bucket configured with static website hosting.
   - Point CloudFront distribution with Origin Access Identity (OAI) to S3 for TLS termination and global edge caching.
2. **Containerized Compute (AWS App Runner or ECS Fargate)**:
   - Build container image: `docker build -t hobby-tracker .`
   - Push image to Amazon Elastic Container Registry (ECR).
   - Create AWS App Runner service linked to ECR repository with automatic scaling between 1 and 10 container tasks.
3. **Database (Amazon RDS Multi-AZ)**:
   - Provision an RDS PostgreSQL `db.t4g.micro` instance in private VPC subnets.
   - Attach IAM database authentication and automated daily snapshots.
4. **Object Storage & Signed URLs**:
   - Create private S3 bucket `hobby-skills-tracker-media` with Block Public Access enabled.
   - App Runner tasks assume IAM role with `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions.
   - Use AWS SDK (Boto3) to generate pre-signed GET URLs with 1-hour expiration.
5. **Monitoring & Observability**:
   - Stream container stdout/stderr to **Amazon CloudWatch Logs**.
   - Configure CloudWatch Alarms on HTTP 5xx errors and container CPU utilization (>75%).
