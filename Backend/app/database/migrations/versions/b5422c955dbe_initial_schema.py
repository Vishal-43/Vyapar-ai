
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b5422c955dbe'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:

    op.create_table('commodities',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=True),
    sa.Column('unit', sa.String(length=50), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_commodities_category'), 'commodities', ['category'], unique=False)
    op.create_index(op.f('ix_commodities_created_at'), 'commodities', ['created_at'], unique=False)
    op.create_index(op.f('ix_commodities_id'), 'commodities', ['id'], unique=False)
    op.create_index(op.f('ix_commodities_name'), 'commodities', ['name'], unique=True)
    op.create_table('markets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('state', sa.String(length=100), nullable=True),
    sa.Column('district', sa.String(length=100), nullable=True),
    sa.Column('latitude', sa.Float(), nullable=True),
    sa.Column('longitude', sa.Float(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name', 'state', name='uq_market_state')
    )
    op.create_index(op.f('ix_markets_created_at'), 'markets', ['created_at'], unique=False)
    op.create_index(op.f('ix_markets_district'), 'markets', ['district'], unique=False)
    op.create_index(op.f('ix_markets_id'), 'markets', ['id'], unique=False)
    op.create_index(op.f('ix_markets_name'), 'markets', ['name'], unique=False)
    op.create_index(op.f('ix_markets_state'), 'markets', ['state'], unique=False)
    op.create_table('prediction_metrics',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('model_name', sa.String(length=100), nullable=False),
    sa.Column('model_version', sa.String(length=50), nullable=False),
    sa.Column('accuracy', sa.Float(), nullable=True),
    sa.Column('rmse', sa.Float(), nullable=True),
    sa.Column('mae', sa.Float(), nullable=True),
    sa.Column('r2_score', sa.Float(), nullable=True),
    sa.Column('mape', sa.Float(), nullable=True),
    sa.Column('precision', sa.Float(), nullable=True),
    sa.Column('recall', sa.Float(), nullable=True),
    sa.Column('f1_score', sa.Float(), nullable=True),
    sa.Column('training_samples', sa.Integer(), nullable=True),
    sa.Column('validation_samples', sa.Integer(), nullable=True),
    sa.Column('test_samples', sa.Integer(), nullable=True),
    sa.Column('training_duration_minutes', sa.Float(), nullable=True),
    sa.Column('last_trained_at', sa.DateTime(), nullable=True),
    sa.Column('feature_importance', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_prediction_metrics_created_at'), 'prediction_metrics', ['created_at'], unique=False)
    op.create_index(op.f('ix_prediction_metrics_id'), 'prediction_metrics', ['id'], unique=False)
    op.create_index('ix_prediction_metrics_model', 'prediction_metrics', ['model_name', 'model_version'], unique=False)
    op.create_index(op.f('ix_prediction_metrics_model_name'), 'prediction_metrics', ['model_name'], unique=False)
    op.create_table('alerts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('commodity_id', sa.Integer(), nullable=True),
    sa.Column('market_id', sa.Integer(), nullable=True),
    sa.Column('alert_type', sa.String(length=50), nullable=False),
    sa.Column('priority', sa.String(length=20), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('conditions', sa.JSON(), nullable=True),
    sa.Column('message', sa.Text(), nullable=True),
    sa.Column('triggered_at', sa.DateTime(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alert_status_priority', 'alerts', ['status', 'priority'], unique=False)
    op.create_index(op.f('ix_alerts_alert_type'), 'alerts', ['alert_type'], unique=False)
    op.create_index(op.f('ix_alerts_created_at'), 'alerts', ['created_at'], unique=False)
    op.create_index(op.f('ix_alerts_id'), 'alerts', ['id'], unique=False)
    op.create_index(op.f('ix_alerts_priority'), 'alerts', ['priority'], unique=False)
    op.create_index(op.f('ix_alerts_status'), 'alerts', ['status'], unique=False)
    op.create_index(op.f('ix_alerts_triggered_at'), 'alerts', ['triggered_at'], unique=False)
    op.create_table('inventory',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('commodity_id', sa.Integer(), nullable=False),
    sa.Column('market_id', sa.Integer(), nullable=False),
    sa.Column('current_stock', sa.Float(), nullable=False),
    sa.Column('optimal_stock', sa.Float(), nullable=True),
    sa.Column('min_stock', sa.Float(), nullable=True),
    sa.Column('max_stock', sa.Float(), nullable=True),
    sa.Column('reorder_point', sa.Float(), nullable=True),
    sa.Column('last_restocked_at', sa.DateTime(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('commodity_id', 'market_id', name='uq_inventory')
    )
    op.create_index(op.f('ix_inventory_created_at'), 'inventory', ['created_at'], unique=False)
    op.create_index(op.f('ix_inventory_id'), 'inventory', ['id'], unique=False)
    op.create_table('market_prices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('commodity_id', sa.Integer(), nullable=False),
    sa.Column('market_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('min_price', sa.Float(), nullable=True),
    sa.Column('max_price', sa.Float(), nullable=True),
    sa.Column('modal_price', sa.Float(), nullable=True),
    sa.Column('price', sa.Float(), nullable=False),
    sa.Column('arrival', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('commodity_id', 'market_id', 'date', name='uq_market_price')
    )
    op.create_index('ix_market_price_commodity_market_date', 'market_prices', ['commodity_id', 'market_id', 'date'], unique=False)
    op.create_index('ix_market_price_date', 'market_prices', ['date'], unique=False)
    op.create_index(op.f('ix_market_prices_created_at'), 'market_prices', ['created_at'], unique=False)
    op.create_index(op.f('ix_market_prices_date'), 'market_prices', ['date'], unique=False)
    op.create_index(op.f('ix_market_prices_id'), 'market_prices', ['id'], unique=False)
    op.create_table('predictions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('commodity_id', sa.Integer(), nullable=False),
    sa.Column('market_id', sa.Integer(), nullable=False),
    sa.Column('prediction_date', sa.Date(), nullable=False),
    sa.Column('predicted_price', sa.Float(), nullable=False),
    sa.Column('actual_price', sa.Float(), nullable=True),
    sa.Column('confidence', sa.Float(), nullable=True),
    sa.Column('model_used', sa.String(length=100), nullable=True),
    sa.Column('error', sa.Float(), nullable=True),
    sa.Column('accuracy', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['commodity_id'], ['commodities.id'], ),
    sa.ForeignKeyConstraint(['market_id'], ['markets.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_prediction_date_commodity_market', 'predictions', ['prediction_date', 'commodity_id', 'market_id'], unique=False)
    op.create_index(op.f('ix_predictions_created_at'), 'predictions', ['created_at'], unique=False)
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
    op.create_index(op.f('ix_predictions_prediction_date'), 'predictions', ['prediction_date'], unique=False)

def downgrade() -> None:

    op.drop_index(op.f('ix_predictions_prediction_date'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_id'), table_name='predictions')
    op.drop_index(op.f('ix_predictions_created_at'), table_name='predictions')
    op.drop_index('ix_prediction_date_commodity_market', table_name='predictions')
    op.drop_table('predictions')
    op.drop_index(op.f('ix_market_prices_id'), table_name='market_prices')
    op.drop_index(op.f('ix_market_prices_date'), table_name='market_prices')
    op.drop_index(op.f('ix_market_prices_created_at'), table_name='market_prices')
    op.drop_index('ix_market_price_date', table_name='market_prices')
    op.drop_index('ix_market_price_commodity_market_date', table_name='market_prices')
    op.drop_table('market_prices')
    op.drop_index(op.f('ix_inventory_id'), table_name='inventory')
    op.drop_index(op.f('ix_inventory_created_at'), table_name='inventory')
    op.drop_table('inventory')
    op.drop_index(op.f('ix_alerts_triggered_at'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_status'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_priority'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_id'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_created_at'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_alert_type'), table_name='alerts')
    op.drop_index('ix_alert_status_priority', table_name='alerts')
    op.drop_table('alerts')
    op.drop_index(op.f('ix_prediction_metrics_model_name'), table_name='prediction_metrics')
    op.drop_index('ix_prediction_metrics_model', table_name='prediction_metrics')
    op.drop_index(op.f('ix_prediction_metrics_id'), table_name='prediction_metrics')
    op.drop_index(op.f('ix_prediction_metrics_created_at'), table_name='prediction_metrics')
    op.drop_table('prediction_metrics')
    op.drop_index(op.f('ix_markets_state'), table_name='markets')
    op.drop_index(op.f('ix_markets_name'), table_name='markets')
    op.drop_index(op.f('ix_markets_id'), table_name='markets')
    op.drop_index(op.f('ix_markets_district'), table_name='markets')
    op.drop_index(op.f('ix_markets_created_at'), table_name='markets')
    op.drop_table('markets')
    op.drop_index(op.f('ix_commodities_name'), table_name='commodities')
    op.drop_index(op.f('ix_commodities_id'), table_name='commodities')
    op.drop_index(op.f('ix_commodities_created_at'), table_name='commodities')
    op.drop_index(op.f('ix_commodities_category'), table_name='commodities')
    op.drop_table('commodities')
