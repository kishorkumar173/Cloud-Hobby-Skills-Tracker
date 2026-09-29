# REST API Reference & Specification

All endpoints communicate via JSON over HTTP(S). Secured endpoints require the header:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "David Miller",
    "username": "david_m",
    "email": "david@example.com",
    "password": "Password123!",
    "interests": "Chess, Piano"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account registered successfully",
    "data": {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "expires_in": 86400,
      "user": {
        "user_id": 5,
        "name": "David Miller",
        "username": "david_m",
        "email": "david@example.com",
        "role": "user",
        "profile_picture": "https://api.dicebear.com/7.x/bottts/svg?seed=david_m"
      }
    },
    "timestamp": "2026-09-29T20:30:00Z"
  }
  ```
- **Error Codes**: `400 Bad Request` (duplicate username/email or validation error).

### 1.2 Login User
- **Method**: `POST`
- **Endpoint**: `/api/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "username_or_email": "david_m",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**: Returns JWT bearer token and user session data.
- **Error Codes**: `401 Unauthorized` (invalid credentials).

### 1.3 Logout User
- **Method**: `POST`
- **Endpoint**: `/api/logout`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: `{"success": true, "message": "Logged out successfully"}`

### 1.4 Get Current User Session
- **Method**: `GET`
- **Endpoint**: `/api/me`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns profile of current authenticated user.

---

## 2. User Profile Endpoints

### 2.1 Get Own Profile
- **Method**: `GET`
- **Endpoint**: `/api/profile`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns full profile including follower and following counts.

### 2.2 Update Profile
- **Method**: `PUT`
- **Endpoint**: `/api/profile`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "name": "David M. Miller",
    "bio": "Lifelong pianist practicing daily.",
    "interests": "Piano, Jazz, Coding"
  }
  ```
- **Success Response (200 OK)**: Returns updated profile fields.

### 2.3 Upload Profile Picture
- **Method**: `POST`
- **Endpoint**: `/api/profile/picture`
- **Auth**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (binary image)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile picture updated successfully",
    "data": {
      "profile_picture": "http://localhost:8000/uploads/users/5/profiles/avatar.jpg",
      "storage_path": "users/5/profiles/avatar.jpg"
    }
  }
  ```

---

## 3. Skills & Hobbies Endpoints

### 3.1 Create Skill
- **Method**: `POST`
- **Endpoint**: `/api/skills`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "skill_name": "Acoustic Guitar",
    "category": "Music",
    "current_level": "BEGINNER",
    "target_level": "ADVANCED",
    "description": "Fingerstyle guitar techniques"
  }
  ```
- **Success Response (201 Created)**: Returns created skill with `skill_id`.

### 3.2 List User Skills
- **Method**: `GET`
- **Endpoint**: `/api/skills?category=Music&status=ACTIVE&search=guitar`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns array of skills enriched with total practice hours.

### 3.3 Get Skill Details
- **Method**: `GET`
- **Endpoint**: `/api/skills/{id}`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns skill details, associated goals, and recent practice logs.

### 3.4 Update Skill
- **Method**: `PUT`
- **Endpoint**: `/api/skills/{id}`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns updated skill confirmation.

### 3.5 Delete Skill
- **Method**: `DELETE`
- **Endpoint**: `/api/skills/{id}`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Deletes skill and cascades to child goals/sessions.

---

## 4. Goals & Milestones Endpoints

### 4.1 Create Goal
- **Method**: `POST`
- **Endpoint**: `/api/goals`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "skill_id": 1,
    "title": "Practice 30 Hours of Guitar",
    "target_value": 30.0,
    "unit": "hours",
    "deadline": "2026-12-31T00:00:00Z"
  }
  ```
- **Success Response (201 Created)**: Creates goal and automatically initializes 4 milestone checkpoints.

### 4.2 List Goals
- **Method**: `GET`
- **Endpoint**: `/api/goals?status=IN_PROGRESS`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns array of goals with calculated `progress_percent` and milestone checklists.

### 4.3 Update Milestone Checkpoint
- **Method**: `PUT`
- **Endpoint**: `/api/goals/milestones/{id}`
- **Auth**: Bearer Token
- **Request Body**: `{"achieved": true}`
- **Success Response (200 OK)**: Toggles milestone achievement.

---

## 5. Practice Sessions Endpoints

### 5.1 Log Practice Session
- **Method**: `POST`
- **Endpoint**: `/api/practice`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "skill_id": 1,
    "duration_minutes": 60,
    "activity": "Fingerstyle arpeggios",
    "notes": "Metronome set at 110bpm"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Practice session recorded successfully",
    "data": {
      "session_id": 12,
      "skill_id": 1,
      "skill_name": "Acoustic Guitar",
      "duration_minutes": 60,
      "activity": "Fingerstyle arpeggios",
      "current_streak": 7,
      "goals_updated": 1,
      "unlocked_milestones": []
    }
  }
  ```

### 5.2 Get Practice History
- **Method**: `GET`
- **Endpoint**: `/api/practice?limit=50`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns chronological practice records.

---

## 6. Community Feed & Social Endpoints

### 6.1 Create Community Post
- **Method**: `POST`
- **Endpoint**: `/api/posts`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "content": "Just completed my 30-hour guitar goal! 🎸",
    "skill_id": 1,
    "media_url": "http://localhost:8000/uploads/users/1/posts/proof.jpg"
  }
  ```
- **Success Response (201 Created)**: Returns `post_id`.

### 6.2 Get Community Feed
- **Method**: `GET`
- **Endpoint**: `/api/feed?sort_by=popular&skill_category=Music`
- **Auth**: Optional (supports anonymous & authenticated)
- **Success Response (200 OK)**: Returns posts stream with likes counts, comments counts, and `is_liked_by_me` state.

### 6.3 Like / Unlike Post
- **Method**: `POST` / `DELETE`
- **Endpoint**: `/api/posts/{id}/like`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Idempotent like toggle returning updated like count.

### 6.4 Add Comment
- **Method**: `POST`
- **Endpoint**: `/api/posts/{id}/comments`
- **Auth**: Bearer Token
- **Request Body**: `{"content": "Outstanding consistency! Keep it up."}`
- **Success Response (201 Created)**: Returns created comment.

---

## 7. Cloud Object Storage Endpoints

### 7.1 Direct File Upload
- **Method**: `POST`
- **Endpoint**: `/api/files/upload`
- **Auth**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (binary), `category` (string, e.g. "skills", "posts")
- **Success Response (201 Created)**: Returns `storage_path` and `public_url`.

### 7.2 Generate Signed URL
- **Method**: `GET`
- **Endpoint**: `/api/files/{id}/signed-url?expires_in=3600`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns cryptographically signed temporary URL.

---

## 8. Analytics & Dashboard Endpoints

### 8.1 Personal Dashboard Analytics
- **Method**: `GET`
- **Endpoint**: `/api/analytics/dashboard`
- **Auth**: Bearer Token
- **Success Response (200 OK)**: Returns total hours, weekly hours, streaks, hours by skill, weekly trend, badges, and recent logs.

### 8.2 Community Overview Analytics
- **Method**: `GET`
- **Endpoint**: `/api/analytics/community`
- **Auth**: Public
- **Success Response (200 OK)**: Returns global statistics (total learners, active skills, cloud practice hours, total posts).
