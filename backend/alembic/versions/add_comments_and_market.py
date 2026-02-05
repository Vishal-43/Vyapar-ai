"""Add market field to discussions and create comments table

Revision ID: add_comments_and_market
Revises: 
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'add_comments_and_market'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add market column to discussions table (if it doesn't exist)
    try:
        op.add_column('discussions', sa.Column('market', sa.String(255), nullable=True))
    except:
        pass  # Column might already exist

    # Create discussion_comments table
    op.create_table(
        'discussion_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('discussion_id', sa.Integer(), nullable=False),
        sa.Column('parent_comment_id', sa.Integer(), nullable=True),
        sa.Column('author', sa.String(255), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('likes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['discussion_id'], ['discussions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['discussion_comments.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_comment_discussion_created', 'discussion_comments', ['discussion_id', 'created_at'])
    op.create_index('ix_comment_parent', 'discussion_comments', ['parent_comment_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_comment_parent', table_name='discussion_comments')
    op.drop_index('ix_comment_discussion_created', table_name='discussion_comments')
    
    # Drop table
    op.drop_table('discussion_comments')
    
    # Remove market column
    try:
        op.drop_column('discussions', 'market')
    except:
        pass
