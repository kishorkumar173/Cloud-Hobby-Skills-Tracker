from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.database import get_db
from backend.models.user import User
from backend.models.skill import Skill
from backend.models.community import Post, Like, Comment
from backend.middleware.auth_middleware import get_current_user, get_optional_current_user
from backend.services.moderation_service import content_moderation
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api", tags=["Community Posts & Feed"])

class CreatePostRequest(BaseModel):
    content: str = Field(..., min_length=2, max_length=1000)
    skill_id: Optional[int] = None
    media_url: Optional[str] = None

@router.post("/posts", status_code=status.HTTP_201_CREATED)
def create_post(
    req: CreatePostRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Shares a new achievement, update, or practice proof to the community feed."""
    # Content moderation & sanitization
    is_clean, clean_content = content_moderation.moderate_content(req.content)
    if not is_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=clean_content)

    # Validate skill if supplied
    if req.skill_id:
        skill = db.query(Skill).filter(Skill.skill_id == req.skill_id).first()
        if not skill:
            req.skill_id = None

    post = Post(
        user_id=current_user.user_id,
        skill_id=req.skill_id,
        content=clean_content,
        media_url=req.media_url
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return success_response(data={"post_id": post.post_id}, message="Post shared to community feed")

@router.get("/feed")
def get_community_feed(
    skill_category: Optional[str] = Query(None),
    sort_by: str = Query("recent"), # 'recent' or 'popular'
    limit: int = Query(30, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves community feed with author profile pictures, skill tags,
    media attachments, like counts, and engagement state.
    """
    query = db.query(Post).join(User, Post.user_id == User.user_id)

    if skill_category:
        query = query.outerjoin(Skill, Post.skill_id == Skill.skill_id).filter(
            Skill.category.ilike(f"%{skill_category.strip()}%")
        )

    if sort_by == "popular":
        # Order by like count descending
        query = query.outerjoin(Like, Post.post_id == Like.post_id).group_by(Post.post_id).order_by(
            func.count(Like.like_id).desc(),
            Post.created_at.desc()
        )
    else:
        query = query.order_by(Post.created_at.desc())

    posts = query.offset(offset).limit(limit).all()

    # Pre-gather liked post ids for current user
    liked_post_ids = set()
    if current_user:
        user_likes = db.query(Like.post_id).filter(
            Like.user_id == current_user.user_id,
            Like.post_id.in_([p.post_id for p in posts])
        ).all()
        liked_post_ids = {ul[0] for ul in user_likes}

    feed_items = []
    for p in posts:
        likes_count = len(p.likes)
        comments_count = len(p.comments)
        feed_items.append({
            "post_id": p.post_id,
            "content": p.content,
            "media_url": p.media_url,
            "created_at": p.created_at.isoformat(),
            "author": {
                "user_id": p.user.user_id,
                "name": p.user.name,
                "username": p.user.username,
                "profile_picture": p.user.profile_picture,
                "role": p.user.role
            },
            "skill": {
                "skill_id": p.skill.skill_id,
                "skill_name": p.skill.skill_name,
                "category": p.skill.category
            } if p.skill else None,
            "likes_count": likes_count,
            "comments_count": comments_count,
            "is_liked_by_me": p.post_id in liked_post_ids
        })

    return success_response(data=feed_items)

@router.get("/posts/{post_id}")
def get_post_detail(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves single post with comments."""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_liked = False
    if current_user:
        is_liked = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.user_id).first() is not None

    comments = [
        {
            "comment_id": c.comment_id,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
            "author": {
                "user_id": c.user.user_id,
                "name": c.user.name,
                "username": c.user.username,
                "profile_picture": c.user.profile_picture
            }
        }
        for c in sorted(post.comments, key=lambda x: x.created_at)
    ]

    return success_response(data={
        "post_id": post.post_id,
        "content": post.content,
        "media_url": post.media_url,
        "created_at": post.created_at.isoformat(),
        "author": {
            "user_id": post.user.user_id,
            "name": post.user.name,
            "username": post.user.username,
            "profile_picture": post.user.profile_picture
        },
        "skill": {
            "skill_id": post.skill.skill_id,
            "skill_name": post.skill.skill_name,
            "category": post.skill.category
        } if post.skill else None,
        "likes_count": len(post.likes),
        "is_liked_by_me": is_liked,
        "comments": comments
    })

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes post if owner or moderator."""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if post.user_id != current_user.user_id and current_user.role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete another user's post."
        )

    db.delete(post)
    db.commit()
    return success_response(message="Post deleted successfully")
