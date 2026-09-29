# Cloud Security, Privacy & Content Moderation

## 1. Security Architecture

### 1.1 Authentication & Password Hashing
- **Algorithm**: `bcrypt` (adaptive blowfish key derivation with automatic salt generation).
- **Bearer Tokens**: Cryptographically signed JSON Web Tokens (JWT) using HMAC-SHA256 (`HS256`).
- **Claim Integrity**: Tokens include `sub` (user_id), `role`, `iat` (issued at), and `exp` (expiration).

### 1.2 Authorization & Multi-Tenant Data Isolation
- Every database query accessing personal resources (`skills`, `goals`, `practice_sessions`, `storage_files`) explicitly filters by `user_id == current_user.user_id`.
- Users cannot access, modify, or delete another user's private practice sessions or goals.
- Moderation privileges (`role == 'moderator' | 'admin'`) allow deleting inappropriate community content without giving access to other users' private passwords or personal emails.

### 1.3 Encryption Standards
- **Encryption in Transit**: All communications enforced via HTTPS / TLS 1.3. Plain HTTP traffic is automatically upgraded or redirected.
- **Encryption at Rest**:
  - Cloud Database storage volumes encrypted via AES-256 (e.g. AWS KMS or Google Cloud default volume encryption).
  - Cloud Object Storage buckets encrypted server-side (SSE-S3 or SSE-KMS).

---

## 2. Cloud Object Storage Security & Pre-Signed URLs

### 2.1 File Validation Pipeline
Before any uploaded byte is written to storage, the `cloud/storage_service.py` pipeline validates:
1. **Extension Whitelisting**: Strictly permits only `jpg, jpeg, png, webp, gif, pdf`.
2. **File Size Capping**: Rejects files exceeding 5MB to prevent storage denial-of-service (DoS).
3. **MIME Type Inspection**: Blocks executable binaries (`application/x-executable`, `application/x-msdownload`).
4. **Key Sanitization**: Generates non-guessable UUIDs (`users/{user_id}/{category}/{uuid}.ext`), eliminating path traversal vulnerabilities (`../../etc/passwd`).

### 2.2 Cryptographically Signed URLs
For private learning artifacts (certificates, draft practice recordings):
- Objects are kept non-public in the bucket.
- Access requires a cryptographic HMAC signature containing the resource key and unix expiration timestamp:
  ```
  /uploads/users/1/skills/cert.pdf?expires=1790000000&signature=8f4a...
  ```
- If an unauthorized party modifies the expiration or path, signature verification fails and access is rejected.

---

## 3. Trust & Safety: Content Moderation

### 3.1 Cross-Site Scripting (XSS) Prevention
- User inputs in post text and comments undergo regex HTML stripping to neutralize `<script>` tags, event handlers (`onerror=alert()`), and nested HTML injections.
- React automatically escapes string bindings in JSX, providing a dual defense-in-depth layer against DOM-based XSS.

### 3.2 SQL / NoSQL Injection Immunity
- Database interactions are written strictly using SQLAlchemy 2.0 parameterized statements and typed ORM models.
- Raw SQL string concatenation is prohibited, preventing SQL injection vulnerabilities.

### 3.3 Spam & Profanity Filtering
- Posts and comments are parsed through `ContentModerationService`.
- Posts containing phishing, malware, or abusive keywords are caught prior to database insertion and return clean error feedback to the user.

---

## 4. Privacy Controls & Data Retention

- **Private vs. Public Profile Fields**:
  - Publicly accessible via `/api/profile/{username}`: `name`, `username`, `bio`, `profile_picture`, `interests`, `followers_count`.
  - Strictly private (never exposed on public APIs): `email`, `password_hash`, `user_id`, private practice reflections.
- **Account & Data Deletion**:
  - Full relational cascade (`ondelete="CASCADE"`) ensures that when a user account is deleted, all associated skills, goals, practice records, and post likes are expunged automatically from the database.
