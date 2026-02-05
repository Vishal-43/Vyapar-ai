
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '004_add_new_features'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():

    op.create_table(
        'discussions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('commodity', sa.String(length=255), nullable=False),
        sa.Column('author', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('likes_count', sa.Integer(), server_default='0'),
        sa.Column('replies_count', sa.Integer(), server_default='0'),
        sa.Column('views_count', sa.Integer(), server_default='0'),
        sa.Column('is_pinned', sa.Boolean(), server_default='false'),
        sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PUBLISHED'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_discussion_commodity_created', 'discussions', ['commodity', 'created_at'])
    op.create_index('ix_discussion_status', 'discussions', ['status'])
    op.create_index('ix_discussions_id', 'discussions', ['id'])
    op.create_index('ix_discussions_commodity', 'discussions', ['commodity'])
    
    op.create_table(
        'watchlists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('commodity_id', sa.Integer(), nullable=False),
        sa.Column('market_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('alert_on_price_change', sa.Boolean(), server_default='false'),
        sa.Column('price_change_threshold', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'commodity_id', 'market_id', name='uq_watchlist')
    )
    op.create_index('ix_watchlist_user', 'watchlists', ['user_id'])
    op.create_index('ix_watchlists_id', 'watchlists', ['id'])
    
    op.create_table(
        'market_trend_analysis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('commodity_id', sa.Integer(), nullable=False),
        sa.Column('market_id', sa.Integer(), nullable=False),
        sa.Column('analysis_date', sa.Date(), nullable=False),
        sa.Column('period_days', sa.Integer(), nullable=False),
        sa.Column('avg_price', sa.Float(), nullable=False),
        sa.Column('min_price', sa.Float(), nullable=False),
        sa.Column('max_price', sa.Float(), nullable=False),
        sa.Column('price_volatility', sa.Float(), nullable=False),
        sa.Column('trend_direction', sa.String(length=20), nullable=False),
        sa.Column('trend_strength', sa.Float(), nullable=False),
        sa.Column('momentum', sa.Float(), nullable=False),
        sa.Column('total_volume', sa.Float(), nullable=True),
        sa.Column('avg_daily_volume', sa.Float(), nullable=True),
        sa.Column('analysis_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
        sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('commodity_id', 'market_id', 'analysis_date', 'period_days', name='uq_trend_analysis')
    )
    op.create_index('ix_trend_analysis_date_period', 'market_trend_analysis', ['analysis_date', 'period_days'])
    op.create_index('ix_market_trend_analysis_id', 'market_trend_analysis', ['id'])

def downgrade():

    op.drop_index('ix_market_trend_analysis_id', table_name='market_trend_analysis')
    op.drop_index('ix_trend_analysis_date_period', table_name='market_trend_analysis')
    op.drop_table('market_trend_analysis')
    
    op.drop_index('ix_watchlists_id', table_name='watchlists')
    op.drop_index('ix_watchlist_user', table_name='watchlists')
    op.drop_table('watchlists')
    
    op.drop_index('ix_discussions_commodity', table_name='discussions')
    op.drop_index('ix_discussions_id', table_name='discussions')
    op.drop_index('ix_discussion_status', table_name='discussions')
    op.drop_index('ix_discussion_commodity_created', table_name='discussions')
    op.drop_table('discussions')
