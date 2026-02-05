"""Discussion comments/replies model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.models import Base


class DiscussionComment(Base):
    """Comments/Replies on discussions."""

    __tablename__ = "discussion_comments"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id", ondelete="CASCADE"), nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("discussion_comments.id"), nullable=True)
    author = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    replies = relationship(
        "DiscussionComment",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    parent = relationship("DiscussionComment", back_populates="replies", remote_side=[id])

    __table_args__ = (
        Index("ix_comment_discussion_created", "discussion_id", "created_at"),
        Index("ix_comment_parent", "parent_comment_id"),
    )

    def __repr__(self):
        return f"<DiscussionComment(id={self.id}, discussion_id={self.discussion_id}, author={self.author})>"
