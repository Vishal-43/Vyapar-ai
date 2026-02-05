"""add selling strategy tables

Revision ID: 006
Revises: 005
Create Date: 2026-02-05 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Create seasonal_price_patterns table
    op.create_table(
        'seasonal_price_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('commodity_id', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('avg_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('std_dev', sa.Numeric(10, 2), nullable=True),
        sa.Column('min_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('max_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('peak_month', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
        sa.CheckConstraint('month >= 1 AND month <= 12', name='check_valid_month'),
        sa.UniqueConstraint('commodity_id', 'month', name='uq_commodity_month')
    )
    
    # Create storage_costs table
    op.create_table(
        'storage_costs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('commodity_id', sa.Integer(), nullable=False),
        sa.Column('cost_per_quintal_per_month', sa.Numeric(10, 2), nullable=False),
        sa.Column('max_storage_days', sa.Integer(), nullable=False),
        sa.Column('perishable', sa.Boolean(), default=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
        sa.UniqueConstraint('commodity_id', name='uq_commodity_storage')
    )
    
    # Create price_volatility table
    op.create_table(
        'price_volatility',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('commodity_id', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(20), nullable=False),  # '30_day', '90_day', '180_day'
        sa.Column('volatility_score', sa.Numeric(5, 4), nullable=False),
        sa.Column('calculated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], )
    )
    
    # Create indexes
    op.create_index('idx_seasonal_patterns_commodity', 'seasonal_price_patterns', ['commodity_id'])
    op.create_index('idx_seasonal_patterns_month', 'seasonal_price_patterns', ['month'])
    op.create_index('idx_storage_costs_commodity', 'storage_costs', ['commodity_id'])
    op.create_index('idx_price_volatility_commodity', 'price_volatility', ['commodity_id'])
    op.create_index('idx_price_volatility_period', 'price_volatility', ['period'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_price_volatility_period', table_name='price_volatility')
    op.drop_index('idx_price_volatility_commodity', table_name='price_volatility')
    op.drop_index('idx_storage_costs_commodity', table_name='storage_costs')
    op.drop_index('idx_seasonal_patterns_month', table_name='seasonal_price_patterns')
    op.drop_index('idx_seasonal_patterns_commodity', table_name='seasonal_price_patterns')
    
    # Drop tables
    op.drop_table('price_volatility')
    op.drop_table('storage_costs')
    op.drop_table('seasonal_price_patterns')
