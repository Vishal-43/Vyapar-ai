"""add recommendations table

Revision ID: 005_add_recommendations
Revises: 004_add_new_features
Create Date: 2026-01-28 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "005_add_recommendations"
down_revision = "004_add_new_features"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("commodity_id", sa.Integer(), sa.ForeignKey("commodities.id"), nullable=True),
        sa.Column("commodity_name", sa.String(length=255), nullable=False),
        sa.Column("market_id", sa.Integer(), sa.ForeignKey("markets.id"), nullable=True),
        sa.Column("market_name", sa.String(length=255), nullable=True),
        sa.Column("recommendation_type", sa.String(length=20), nullable=False),
        sa.Column("confidence", sa.String(length=20), nullable=False),
        sa.Column("reasoning", sa.Text(), nullable=False),
        sa.Column("current_price", sa.Float(), nullable=True),
        sa.Column("target_price", sa.Float(), nullable=True),
        sa.Column("expected_change_pct", sa.Float(), nullable=True),
        sa.Column("time_horizon", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("acknowledged", sa.Boolean(), nullable=False),
        sa.Column("acknowledgement_note", sa.Text(), nullable=True),
        sa.Column("last_evaluated_at", sa.DateTime(), nullable=True),
        sa.Column("outcome", sa.String(length=20), nullable=True),
        sa.Column("actual_change_pct", sa.Float(), nullable=True),
        sa.Column("roi_pct", sa.Float(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_status", "recommendations", ["status"])
    op.create_index("ix_recommendations_created_at", "recommendations", ["created_at"])
    op.create_index("ix_recommendations_expires_at", "recommendations", ["expires_at"])
    op.create_index("ix_recommendations_recommendation_type", "recommendations", ["recommendation_type"])
    op.create_index("ix_recommendations_outcome", "recommendations", ["outcome"])
    op.create_index("ix_recommendation_user_status", "recommendations", ["user_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_recommendation_user_status", table_name="recommendations")
    op.drop_index("ix_recommendations_outcome", table_name="recommendations")
    op.drop_index("ix_recommendations_recommendation_type", table_name="recommendations")
    op.drop_index("ix_recommendations_expires_at", table_name="recommendations")
    op.drop_index("ix_recommendations_created_at", table_name="recommendations")
    op.drop_index("ix_recommendations_status", table_name="recommendations")
    op.drop_index("ix_recommendations_user_id", table_name="recommendations")
    op.drop_table("recommendations")
