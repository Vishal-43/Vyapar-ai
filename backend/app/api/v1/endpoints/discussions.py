
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import get_db
from app.models.schemas import (
    DiscussionCreate,
    DiscussionUpdate,
    DiscussionResponse,
    DiscussionListResponse,
    CommentCreate,
    CommentResponse,
    CommentListResponse,
)
from app.database.repositories import DiscussionRepository
from app.database.models import Discussion, Comment, DiscussionLike
from app.core.utils import get_current_timestamp

router = APIRouter(prefix="/discussions", tags=["Discussions"])

def get_discussion_repo(db=Depends(get_db)) -> DiscussionRepository:

    return DiscussionRepository(db)


@router.get("/", response_model=DiscussionListResponse)
async def get_discussions(
    commodity: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("recent", pattern="^(recent|popular|views)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionListResponse:

    try:
        if search:
            discussions = await repo.search(search, skip, limit)
        elif commodity:
            discussions = await repo.get_by_commodity(commodity, skip, limit)
        else:
            discussions = await repo.get_recent(skip, limit)

        if sort_by == "popular":
            discussions.sort(key=lambda x: x.likes_count, reverse=True)
        elif sort_by == "views":
            discussions.sort(key=lambda x: x.views_count, reverse=True)

        responses = [
            DiscussionResponse(
                id=d.id,
                title=d.title,
                content=d.content,
                commodity=d.commodity,
                market=d.market,
                author=d.author,
                avatar_url=d.avatar_url,
                likes_count=d.likes_count,
                replies_count=d.replies_count,
                views_count=d.views_count,
                is_pinned=d.is_pinned,
                tags=d.tags or [],
                status=d.status,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in discussions
        ]

        return DiscussionListResponse(
            discussions=responses,
            total=len(responses),
            page=skip // limit + 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error fetching discussions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch discussions")

@router.get("/pinned", response_model=List[DiscussionResponse])
async def get_pinned_discussions(
    limit: int = Query(10, ge=1, le=20),
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> List[DiscussionResponse]:

    try:
        discussions = await repo.get_pinned(limit)
        return [
            DiscussionResponse(
                id=d.id,
                title=d.title,
                content=d.content,
                commodity=d.commodity,
                market=d.market,
                author=d.author,
                avatar_url=d.avatar_url,
                likes_count=d.likes_count,
                replies_count=d.replies_count,
                views_count=d.views_count,
                is_pinned=d.is_pinned,
                tags=d.tags or [],
                status=d.status,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in discussions
        ]
    except Exception as e:
        logger.error(f"Error fetching pinned discussions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch pinned discussions")

@router.get("/{discussion_id}", response_model=DiscussionResponse)
async def get_discussion(
    discussion_id: int,
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionResponse:

    try:
        discussion = await repo.get_by_id(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")

        await repo.increment_views(discussion_id)

        return DiscussionResponse(
            id=discussion.id,
            title=discussion.title,
            content=discussion.content,
            commodity=discussion.commodity,
            author=discussion.author,
            avatar_url=discussion.avatar_url,
            likes_count=discussion.likes_count,
            replies_count=discussion.replies_count,
            views_count=discussion.views_count + 1,
            is_pinned=discussion.is_pinned,
            tags=discussion.tags or [],
            status=discussion.status,
            created_at=discussion.created_at,
            updated_at=discussion.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch discussion")

@router.post("/", response_model=DiscussionResponse, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    request: DiscussionCreate,
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionResponse:

    try:
        avatar_url = request.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={request.author}"

        discussion = await repo.create(
            title=request.title,
            content=request.content,
            commodity=request.commodity,
            market=request.market,
            author=request.author,
            avatar_url=avatar_url,
            tags=request.tags or [],
            status="PUBLISHED",
            likes_count=0,
            replies_count=0,
            views_count=0,
            is_pinned=False,
        )

        await repo.db.commit()

        logger.info(f"Discussion created: {discussion.id} by {request.author}")

        return DiscussionResponse(
            id=discussion.id,
            title=discussion.title,
            content=discussion.content,
            commodity=discussion.commodity,
            author=discussion.author,
            avatar_url=discussion.avatar_url,
            likes_count=discussion.likes_count,
            replies_count=discussion.replies_count,
            views_count=discussion.views_count,
            is_pinned=discussion.is_pinned,
            tags=discussion.tags or [],
            status=discussion.status,
            created_at=discussion.created_at,
            updated_at=discussion.updated_at,
        )
    except Exception as e:
        logger.error(f"Error creating discussion: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create discussion")

@router.put("/{discussion_id}", response_model=DiscussionResponse)
async def update_discussion(
    discussion_id: int,
    request: DiscussionUpdate,
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionResponse:

    try:
        discussion = await repo.get_by_id(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")

        if request.title:
            discussion.title = request.title
        if request.content:
            discussion.content = request.content
        if request.tags is not None:
            discussion.tags = request.tags

        discussion.updated_at = get_current_timestamp()
        await repo.db.flush()
        await repo.db.commit()

        logger.info(f"Discussion {discussion_id} updated")

        return DiscussionResponse(
            id=discussion.id,
            title=discussion.title,
            content=discussion.content,
            commodity=discussion.commodity,
            author=discussion.author,
            avatar_url=discussion.avatar_url,
            likes_count=discussion.likes_count,
            replies_count=discussion.replies_count,
            views_count=discussion.views_count,
            is_pinned=discussion.is_pinned,
            tags=discussion.tags or [],
            status=discussion.status,
            created_at=discussion.created_at,
            updated_at=discussion.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update discussion")

@router.delete("/{discussion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_discussion(
    discussion_id: int,
    repo: DiscussionRepository = Depends(get_discussion_repo),
):

    try:
        discussion = await repo.get_by_id(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")

        discussion.status = "ARCHIVED"
        await repo.db.flush()
        await repo.db.commit()

        logger.info(f"Discussion {discussion_id} archived")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete discussion")

@router.post("/{discussion_id}/like", response_model=DiscussionResponse)
async def like_discussion(
    discussion_id: int,
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionResponse:

    try:
        discussion = await repo.increment_likes(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")

        await repo.db.commit()

        logger.info(f"Discussion {discussion_id} liked")

        return DiscussionResponse(
            id=discussion.id,
            title=discussion.title,
            content=discussion.content,
            commodity=discussion.commodity,
            author=discussion.author,
            avatar_url=discussion.avatar_url,
            likes_count=discussion.likes_count,
            replies_count=discussion.replies_count,
            views_count=discussion.views_count,
            is_pinned=discussion.is_pinned,
            tags=discussion.tags or [],
            status=discussion.status,
            created_at=discussion.created_at,
            updated_at=discussion.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error liking discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to like discussion")

@router.get("/commodity/{commodity}", response_model=DiscussionListResponse)
async def get_discussions_by_commodity(
    commodity: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> DiscussionListResponse:

    try:
        discussions = await repo.get_by_commodity(commodity, skip, limit)

        responses = [
            DiscussionResponse(
                id=d.id,
                title=d.title,
                content=d.content,
                commodity=d.commodity,
                market=d.market,
                author=d.author,
                avatar_url=d.avatar_url,
                likes_count=d.likes_count,
                replies_count=d.replies_count,
                views_count=d.views_count,
                is_pinned=d.is_pinned,
                tags=d.tags or [],
                status=d.status,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in discussions
        ]

        return DiscussionListResponse(
            discussions=responses,
            total=len(responses),
            page=skip // limit + 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error fetching discussions for commodity {commodity}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch discussions")


# Comment endpoints
@router.get("/{discussion_id}/comments", response_model=CommentListResponse)
async def get_comments(
    discussion_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db=Depends(get_db),
) -> CommentListResponse:
    """Get comments for a discussion."""
    from sqlalchemy import select
    try:
        stmt = select(Comment).where(Comment.discussion_id == discussion_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        comments = result.scalars().all()
        
        responses = [
            CommentResponse(
                id=c.id,
                discussion_id=c.discussion_id,
                author=c.author,
                avatar_url=c.avatar_url,
                content=c.content,
                likes_count=c.likes_count,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in comments
        ]
        
        return CommentListResponse(comments=responses, total=len(responses))
    except Exception as e:
        logger.error(f"Error fetching comments for discussion {discussion_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


@router.post("/{discussion_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    discussion_id: int,
    request: CommentCreate,
    db=Depends(get_db),
    repo: DiscussionRepository = Depends(get_discussion_repo),
) -> CommentResponse:
    """Create a comment on a discussion."""
    try:
        # Verify discussion exists
        discussion = await repo.get_by_id(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        avatar_url = request.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={request.author}"
        
        comment = Comment(
            discussion_id=discussion_id,
            author=request.author,
            avatar_url=avatar_url,
            content=request.content,
            likes_count=0,
        )
        
        db.add(comment)
        
        # Increment replies count on discussion
        discussion.replies_count = (discussion.replies_count or 0) + 1
        
        await db.flush()
        await db.commit()
        await db.refresh(comment)
        
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.post("/{discussion_id}/like/toggle")
async def toggle_like(
    discussion_id: int,
    user_id: str = Query(..., description="User ID for tracking likes"),
    db=Depends(get_db),
    repo: DiscussionRepository = Depends(get_discussion_repo),
):
    """Toggle like on a discussion."""
    from sqlalchemy import select
    try:
        discussion = await repo.get_by_id(discussion_id)
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Check if user already liked
        stmt = select(DiscussionLike).where(
            DiscussionLike.discussion_id == discussion_id,
            DiscussionLike.user_id == user_id
        )
        result = await db.execute(stmt)
        existing_like = result.scalar_one_or_none()
        
        if existing_like:
            # Unlike
            await db.delete(existing_like)
            discussion.likes_count = max(0, (discussion.likes_count or 0) - 1)
            liked = False
        else:
            # Like
            new_like = DiscussionLike(discussion_id=discussion_id, user_id=user_id)
            db.add(new_like)
            discussion.likes_count = (discussion.likes_count or 0) + 1
            liked = True
        
        await db.flush()
        await db.commit()
        
        return {
            "liked": liked,
            "likes_count": discussion.likes_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling like: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle like")
