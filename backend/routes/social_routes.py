from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from backend.database import get_db
from backend.models.user import User, Follow
from backend.models.community import Post, Like, Comment
from backend.middleware.auth_middleware import get_current_user
from backend.services.moderation_service import content_moderation
from backend.utils.helpers import success_response

router = APIRouter(prefix="/api", tags=["Social Interactions (Likes, Comments, Follows)"])

class AddCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

# --- LIKES ---

@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Likes a post with idempotency / duplicate-prevention."""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.user_id
    ).first()

    if existing_like:
        return success_response(
            data={"post_id": post_id, "likes_count": len(post.likes), "is_liked": True},
            message="Post was already liked"
        )

    new_like = Like(post_id=post_id, user_id=current_user.user_id)
    db.add(new_like)
    db.commit()

    total_likes = db.query(Like).filter(Like.post_id == post_id).count()
    return success_response(
        data={"post_id": post_id, "likes_count": total_likes, "is_liked": True},
        message="Post liked"
    )

@router.delete("/posts/{post_id}/like")
def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes a like from a post."""
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.user_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()

    total_likes = db.query(Like).filter(Like.post_id == post_id).count()
    return success_response(
        data={"post_id": post_id, "likes_count": total_likes, "is_liked": False},
        message="Post unliked"
    )

# --- COMMENTS ---

@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    req: AddCommentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a comment to a community post."""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_clean, clean_text = content_moderation.moderate_content(req.content)
    if not is_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=clean_text)

    comment = Comment(
        post_id=post_id,
        user_id=current_user.user_id,
        content=clean_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return success_response(data={
        "comment_id": comment.comment_id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
        "author": {
            "user_id": current_user.user_id,
            "name": current_user.name,
            "username": current_user.username,
            "profile_picture": current_user.profile_picture
        }
    }, message="Comment added")

@router.get("/posts/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    """Retrieves all comments for a post."""
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    results = [
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
        for c in comments
    ]
    return success_response(data=results)

@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes comment if owner or moderator."""
    comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.user_id and current_user.role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete another user's comment."
        )

    db.delete(comment)
    db.commit()
    return success_response(message="Comment deleted")

# --- FOLLOW SYSTEM ---

@router.post("/users/{target_user_id}/follow")
def follow_user(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follows another user."""
    if target_user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself")

    target = db.query(User).filter(User.user_id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.user_id,
        Follow.following_id == target_user_id
    ).first()

    if not existing:
        db.add(Follow(follower_id=current_user.user_id, following_id=target_user_id))
        db.commit()

    return success_response(message=f"You are now following {target.username}")

@router.delete("/users/{target_user_id}/follow")
def unfollow_user(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollows a user."""
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.user_id,
        Follow.following_id == target_user_id
    ).first()

    if follow:
        db.delete(follow)
        db.commit()

    return success_response(message="Unfollowed user successfully")
