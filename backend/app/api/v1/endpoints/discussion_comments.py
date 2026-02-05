"""Discussion comments endpoints."""

from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import get_db
from app.models.schemas import CommentCreate, CommentResponse, CommentListResponse
from app.database.repositories import CommentRepository
from app.core.utils import get_current_timestamp


router = APIRouter()


def get_comment_repo(db=Depends(get_db)) -> CommentRepository:
    """Get comment repository."""
    return CommentRepository(db)


@router.get("/{discussion_id}/comments", response_model=CommentListResponse)
async def get_comments(
    discussion_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    repo: CommentRepository = Depends(get_comment_repo),
) -> CommentListResponse:
    """Get comments for a discussion."""
    try:
        comments = await repo.get_by_discussion(discussion_id, skip, limit)

        responses = [
            CommentResponse(
                id=c.id,
                discussion_id=c.discussion_id,
                author=c.author,
                avatar_url=c.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={c.author}",
                content=c.content,
                likes_count=c.likes_count,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in comments
        ]

        return CommentListResponse(
            comments=responses,
            total=len(responses),
            page=skip // limit + 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error fetching comments for discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


@router.post("/{discussion_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    discussion_id: int,
    request: CommentCreate,
    repo: CommentRepository = Depends(get_comment_repo),
) -> CommentResponse:
    """Create a new comment on a discussion."""
    try:
        avatar_url = request.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={request.author}"

        comment = await repo.create(
            discussion_id=discussion_id,
            author=request.author,
            avatar_url=avatar_url,
            content=request.content,
            likes_count=0,
        )

        # Update discussion reply count
        from app.database.repositories import DiscussionRepository
        disc_repo = DiscussionRepository(repo.db)
        await disc_repo.increment_replies(discussion_id)

        logger.info(f"Comment created on discussion {discussion_id} by {request.author}")

        return CommentResponse(
            id=comment.id,
            discussion_id=comment.discussion_id,
            author=comment.author,
            avatar_url=comment.avatar_url,
            content=comment.content,
            likes_count=comment.likes_count,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.post("/{discussion_id}/comments/{comment_id}/like", response_model=CommentResponse)
async def like_comment(
    discussion_id: int,
    comment_id: int,
    repo: CommentRepository = Depends(get_comment_repo),
) -> CommentResponse:
    """Like a comment."""
    try:
        comment = await repo.increment_likes(comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        logger.info(f"Comment {comment_id} liked")

        return CommentResponse(
            id=comment.id,
            discussion_id=comment.discussion_id,
            author=comment.author,
            avatar_url=comment.avatar_url,
            content=comment.content,
            likes_count=comment.likes_count,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to like comment")


@router.delete("/{discussion_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    discussion_id: int,
    comment_id: int,
    repo: CommentRepository = Depends(get_comment_repo),
):
    """Delete a comment."""
    try:
        success = await repo.delete(comment_id)
        if not success:
            raise HTTPException(status_code=404, detail="Comment not found")

        # Update discussion reply count
        from app.database.repositories import DiscussionRepository
        disc_repo = DiscussionRepository(repo.db)
        await disc_repo.decrement_replies(discussion_id)

        logger.info(f"Comment {comment_id} deleted")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")
