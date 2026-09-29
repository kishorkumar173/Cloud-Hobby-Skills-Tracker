import os
import sys
from datetime import datetime, timedelta

# Ensure parent directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import SessionLocal, Base, engine
from backend.models.user import User, Follow
from backend.models.skill import Skill, SkillLevel, SkillStatus
from backend.models.goal import Goal, Milestone
from backend.models.practice import PracticeSession
from backend.models.community import Post, Like, Comment
from cloud.auth_service import cloud_auth

def seed_database():
    print("[*] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("[!] Database already contains users. Skipping duplicate seeding.")
            return

        print("[*] Seeding synthetic learners & profiles...")
        now = datetime.utcnow()

        # Dummy Users
        users_data = [
            {
                "name": "Alex Johnson",
                "username": "alex_creator",
                "email": "alex@example.com",
                "password": "Password123!",
                "role": "user",
                "bio": "Guitarist & software engineer passionate about generative art and fingerstyle jazz.",
                "interests": "Guitar, Coding, Photography, Fitness",
                "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces"
            },
            {
                "name": "Sarah Chen",
                "username": "sarah_lens",
                "email": "sarah@example.com",
                "password": "Password123!",
                "role": "moderator",
                "bio": "Urban photographer capturing golden hour reflections. Also learning Python for data art.",
                "interests": "Photography, Coding, Cooking",
                "profile_picture": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces"
            },
            {
                "name": "Marcus Rivera",
                "username": "marcus_fit",
                "email": "marcus@example.com",
                "password": "Password123!",
                "role": "user",
                "bio": "Calisthenics athlete and amateur chess enthusiast. Tracking discipline daily.",
                "interests": "Fitness, Chess, Gardening",
                "profile_picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces"
            },
            {
                "name": "Maya Patel",
                "username": "maya_art",
                "email": "maya@example.com",
                "password": "Password123!",
                "role": "user",
                "bio": "Watercolor painter & digital illustrator experimenting with oil pastels and Japanese culinary arts.",
                "interests": "Art, Cooking, Writing",
                "profile_picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces"
            }
        ]

        created_users = []
        for ud in users_data:
            user = User(
                name=ud["name"],
                username=ud["username"],
                email=ud["email"],
                password_hash=cloud_auth.get_password_hash(ud["password"]),
                role=ud["role"],
                bio=ud["bio"],
                interests=ud["interests"],
                profile_picture=ud["profile_picture"],
                created_at=now - timedelta(days=45)
            )
            db.add(user)
            created_users.append(user)
        db.commit()

        u1, u2, u3, u4 = created_users

        # Follow relationships
        db.add_all([
            Follow(follower_id=u1.user_id, following_id=u2.user_id),
            Follow(follower_id=u1.user_id, following_id=u3.user_id),
            Follow(follower_id=u2.user_id, following_id=u1.user_id),
            Follow(follower_id=u3.user_id, following_id=u1.user_id),
            Follow(follower_id=u4.user_id, following_id=u1.user_id),
        ])
        db.commit()

        print("[*] Seeding skills for Alex Johnson (User A)...")
        # Skills for User A (Alex)
        s_guitar = Skill(
            user_id=u1.user_id,
            skill_name="Acoustic Guitar",
            category="Music",
            current_level=SkillLevel.INTERMEDIATE.value,
            target_level=SkillLevel.ADVANCED.value,
            status=SkillStatus.ACTIVE.value,
            description="Mastering acoustic fingerstyle, percussive tapping, and Neo-Soul jazz chords.",
            icon="Music",
            created_at=now - timedelta(days=40)
        )
        s_coding = Skill(
            user_id=u1.user_id,
            skill_name="Full-Stack Cloud Development",
            category="Coding",
            current_level=SkillLevel.INTERMEDIATE.value,
            target_level=SkillLevel.ADVANCED.value,
            status=SkillStatus.ACTIVE.value,
            description="Designing scalable microservices, FastAPI REST APIs, and React dashboards on AWS/GCP.",
            icon="Code",
            created_at=now - timedelta(days=35)
        )
        s_photo = Skill(
            user_id=u1.user_id,
            skill_name="Landscape Photography",
            category="Photography",
            current_level=SkillLevel.BEGINNER.value,
            target_level=SkillLevel.INTERMEDIATE.value,
            status=SkillStatus.ACTIVE.value,
            description="Focusing on raw exposure bracketing, ND filter long exposures, and Lightroom color grading.",
            icon="Camera",
            created_at=now - timedelta(days=20)
        )
        s_fitness = Skill(
            user_id=u1.user_id,
            skill_name="Calisthenics & Strength",
            category="Fitness",
            current_level=SkillLevel.BEGINNER.value,
            target_level=SkillLevel.INTERMEDIATE.value,
            status=SkillStatus.ACTIVE.value,
            description="Progressing through muscle-ups, handstands, and weighted pull-ups.",
            icon="Activity",
            created_at=now - timedelta(days=15)
        )
        db.add_all([s_guitar, s_coding, s_photo, s_fitness])
        db.commit()

        # Skills for other users
        s_sarah_photo = Skill(
            user_id=u2.user_id,
            skill_name="Street & Portrait Photography",
            category="Photography",
            current_level=SkillLevel.ADVANCED.value,
            target_level=SkillLevel.ADVANCED.value,
            status=SkillStatus.ACTIVE.value,
            description="35mm prime lens street documentary photography.",
            icon="Camera",
            created_at=now - timedelta(days=50)
        )
        s_maya_art = Skill(
            user_id=u4.user_id,
            skill_name="Watercolor Painting",
            category="Art",
            current_level=SkillLevel.INTERMEDIATE.value,
            target_level=SkillLevel.ADVANCED.value,
            status=SkillStatus.ACTIVE.value,
            description="Botanical watercolor botanical illustrations and wash techniques.",
            icon="Palette",
            created_at=now - timedelta(days=30)
        )
        db.add_all([s_sarah_photo, s_maya_art])
        db.commit()

        print("[*] Seeding goals & milestones...")
        # Goals for Alex
        g1 = Goal(
            user_id=u1.user_id,
            skill_id=s_guitar.skill_id,
            title="Practice 30 Hours of Acoustic Fingerstyle",
            target_value=30.0,
            current_value=18.5,
            unit="hours",
            deadline=now + timedelta(days=20),
            status="IN_PROGRESS",
            created_at=now - timedelta(days=30)
        )
        db.add(g1)
        db.flush()

        m1_1 = Milestone(goal_id=g1.goal_id, title="5 Hours - Basic Fingerpicking Patterns", target_value=5.0, achieved=True, achieved_at=now - timedelta(days=22))
        m1_2 = Milestone(goal_id=g1.goal_id, title="10 Hours - Percussive Slap Techniques", target_value=10.0, achieved=True, achieved_at=now - timedelta(days=14))
        m1_3 = Milestone(goal_id=g1.goal_id, title="20 Hours - Master 'Neon' Intro & Rhythm", target_value=20.0, achieved=False)
        m1_4 = Milestone(goal_id=g1.goal_id, title="30 Hours - Record Full Solo Acoustic Track", target_value=30.0, achieved=False)
        db.add_all([m1_1, m1_2, m1_3, m1_4])

        g2 = Goal(
            user_id=u1.user_id,
            skill_id=s_coding.skill_id,
            title="Ship 5 Production Cloud Microservices",
            target_value=5.0,
            current_value=3.0,
            unit="projects",
            deadline=now + timedelta(days=15),
            status="IN_PROGRESS",
            created_at=now - timedelta(days=25)
        )
        db.add(g2)
        db.flush()
        db.add_all([
            Milestone(goal_id=g2.goal_id, title="Deploy Dockerized Auth Service", target_value=1.0, achieved=True, achieved_at=now - timedelta(days=18)),
            Milestone(goal_id=g2.goal_id, title="Integrate Cloud Object Storage", target_value=2.0, achieved=True, achieved_at=now - timedelta(days=10)),
            Milestone(goal_id=g2.goal_id, title="Implement Real-Time Analytics Pipeline", target_value=3.0, achieved=True, achieved_at=now - timedelta(days=2)),
            Milestone(goal_id=g2.goal_id, title="Complete End-to-End CI/CD Pipeline", target_value=5.0, achieved=False)
        ])
        db.commit()

        print("[*] Seeding practice sessions across recent days to establish streaks...")
        # 7 consecutive days of practice for Alex to create an active 7-day streak!
        sessions_data = [
            (s_guitar.skill_id, 90, "Fingerstyle arpeggios & modal chord transitions", "Felt smooth, worked with metronome at 110bpm.", 0), # Today
            (s_coding.skill_id, 120, "Built cloud storage signed URL generator in FastAPI", "Secured bucket access using HMAC sha256 signatures.", 1), # Yesterday
            (s_photo.skill_id, 60, "Golden hour architectural composition", "Used 24mm prime lens, high dynamic range bracket.", 2),
            (s_guitar.skill_id, 75, "Percussive thumb slap & harmonic tapping", "Cleaned up resonance on 7th fret harmonics.", 3),
            (s_fitness.skill_id, 45, "Bar muscle-up progression & hollow body holds", "Achieved 3 clean muscle-ups in first set!", 4),
            (s_coding.skill_id, 90, "Implemented analytics dashboard aggregation queries", "SQLAlchemy joins optimized for sub-millisecond response.", 5),
            (s_guitar.skill_id, 60, "Rhythm cadence & Travis picking practice", "Practiced Tommy Emmanuel style fingerpicking.", 6),
            # Older sessions
            (s_coding.skill_id, 150, "Designed database schema and migrations", "Normalized 8 entity tables with index constraints.", 8),
            (s_guitar.skill_id, 60, "Barre chord stamina exercise", "Hand fatigue reduced, cleaner 6th string barre.", 9),
            (s_photo.skill_id, 90, "Lightroom editing masterclass & preset calibration", "Created custom cine-teal film simulation preset.", 12),
        ]

        for s_id, duration, activity, notes, days_ago in sessions_data:
            sess = PracticeSession(
                user_id=u1.user_id,
                skill_id=s_id,
                duration_minutes=duration,
                activity=activity,
                notes=notes,
                practiced_at=now - timedelta(days=days_ago, hours=2, minutes=15)
            )
            db.add(sess)

        # Practice for Sarah and Maya
        db.add(PracticeSession(
            user_id=u2.user_id,
            skill_id=s_sarah_photo.skill_id,
            duration_minutes=120,
            activity="Rainy night neon reflection street portraits",
            notes="Moody reflections with f/1.4 aperture.",
            practiced_at=now - timedelta(hours=5)
        ))
        db.add(PracticeSession(
            user_id=u4.user_id,
            skill_id=s_maya_art.skill_id,
            duration_minutes=80,
            activity="Wet-on-wet Japanese cherry blossom painting",
            notes="Layered crimson and soft magenta washes.",
            practiced_at=now - timedelta(hours=10)
        ))
        db.commit()

        print("[*] Seeding community posts, likes, and comments...")
        # Community Post 1 by Alex
        p1 = Post(
            user_id=u1.user_id,
            skill_id=s_guitar.skill_id,
            content="Just crossed 18 hours of acoustic fingerstyle practice! Hit the second milestone today. Next stop: 30 hours of solo recording! 🎸✨",
            media_url="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&fit=crop",
            created_at=now - timedelta(days=1, hours=4)
        )
        # Community Post 2 by Sarah
        p2 = Post(
            user_id=u2.user_id,
            skill_id=s_sarah_photo.skill_id,
            content="Captured this stunning golden hour silhouette in downtown today during my 60-min practice session! Feedback welcome! 📸🌅",
            media_url="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&fit=crop",
            created_at=now - timedelta(days=2, hours=1)
        )
        # Community Post 3 by Maya
        p3 = Post(
            user_id=u4.user_id,
            skill_id=s_maya_art.skill_id,
            content="Finished this botanical watercolor study! 30 days of consistent brushwork is finally paying off. Keep practicing everyone! 🎨🌸",
            media_url="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&fit=crop",
            created_at=now - timedelta(hours=8)
        )
        # Community Post 4 by Alex
        p4 = Post(
            user_id=u1.user_id,
            skill_id=s_coding.skill_id,
            content="Containerized our whole cloud backend with Docker & FastAPI! Loving the speed of asynchronous Python APIs. 🚀💻",
            media_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&fit=crop",
            created_at=now - timedelta(hours=3)
        )
        db.add_all([p1, p2, p3, p4])
        db.commit()

        # Likes
        db.add_all([
            Like(post_id=p1.post_id, user_id=u2.user_id),
            Like(post_id=p1.post_id, user_id=u3.user_id),
            Like(post_id=p1.post_id, user_id=u4.user_id),
            Like(post_id=p2.post_id, user_id=u1.user_id),
            Like(post_id=p2.post_id, user_id=u4.user_id),
            Like(post_id=p3.post_id, user_id=u1.user_id),
            Like(post_id=p3.post_id, user_id=u2.user_id),
            Like(post_id=p4.post_id, user_id=u2.user_id),
        ])

        # Comments
        db.add_all([
            Comment(post_id=p1.post_id, user_id=u2.user_id, content="Incredible progress Alex! Fingerstyle acoustic is tough, keep shredding!"),
            Comment(post_id=p1.post_id, user_id=u3.user_id, content="That guitar looks gorgeous! What tuning are you using?"),
            Comment(post_id=p2.post_id, user_id=u1.user_id, content="The lighting on this is magnificent Sarah! Did you use an ND filter?"),
            Comment(post_id=p3.post_id, user_id=u2.user_id, content="The color transitions on the petals are so delicate. Inspiring work Maya!"),
            Comment(post_id=p4.post_id, user_id=u3.user_id, content="FastAPI + Docker is the best cloud stack. Nice work!"),
        ])
        db.commit()

        print("[SUCCESS] Database seeded successfully with 4 users, 6 skills, 2 goals, 8 milestones, 12 practice sessions, 4 posts, 8 likes, and 5 comments!")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
