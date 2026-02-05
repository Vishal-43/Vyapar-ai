"""add farmer profit tables

Revision ID: 007_add_farmer_profit
Revises: 006
Create Date: 2026-02-06 01:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_add_farmer_profit'
down_revision = 'b5422c955dbe'  # Previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Create regions table (if not exists)
    op.create_table('regions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('lat', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('lon', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crops table
    op.create_table('crops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('season', sa.String(length=50), nullable=True),
        sa.Column('growth_duration_days', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crop_economics table
    op.create_table('crop_economics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('region_id', sa.Integer(), nullable=True),
        sa.Column('yield_per_hectare', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('avg_price_per_kg', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.ForeignKeyConstraint(['region_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crop_costs table
    op.create_table('crop_costs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('region_id', sa.Integer(), nullable=True),
        sa.Column('cost_category', sa.String(length=50), nullable=True),
        sa.Column('amount_per_hectare', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.ForeignKeyConstraint(['region_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crop_characteristics table
    op.create_table('crop_characteristics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('soil_type', sa.String(length=50), nullable=True),
        sa.Column('water_needs', sa.String(length=20), nullable=True),
        sa.Column('nitrogen_fixing', sa.Boolean(), server_default=sa.text('0'), nullable=True),
        sa.Column('perishability', sa.String(length=20), nullable=True),
        sa.Column('market_demand', sa.String(length=20), nullable=True),
        sa.Column('export_potential', sa.Boolean(), server_default=sa.text('0'), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crop_growth_stages table
    op.create_table('crop_growth_stages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('stage_name', sa.String(length=50), nullable=True),
        sa.Column('days_from_sowing_start', sa.Integer(), nullable=True),
        sa.Column('days_from_sowing_end', sa.Integer(), nullable=True),
        sa.Column('critical_flag', sa.Boolean(), server_default=sa.text('0'), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create direct_buyers table
    op.create_table('direct_buyers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('lat', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('lon', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('verified', sa.Boolean(), server_default=sa.text('0'), nullable=True),
        sa.Column('rating', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('reviews_count', sa.Integer(), server_default=sa.text('0'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create buyer_commodities table
    op.create_table('buyer_commodities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=True),
        sa.Column('commodity_id', sa.Integer(), nullable=True),
        sa.Column('min_quantity_kg', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('offered_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('advance_payment_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('quality_requirements', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['buyer_id'], ['direct_buyers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create farmers table
    op.create_table('farmers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('region_id', sa.Integer(), nullable=True),
        sa.Column('land_hectares', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('capital_available', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('risk_tolerance', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['region_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone')
    )
    
    # Create farmer_fields table
    op.create_table('farmer_fields',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farmer_id', sa.Integer(), nullable=True),
        sa.Column('field_name', sa.String(length=100), nullable=True),
        sa.Column('location_lat', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('location_lon', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column('area_hectares', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('soil_type', sa.String(length=50), nullable=True),
        sa.Column('water_availability', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create farmer_crops table
    op.create_table('farmer_crops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farmer_id', sa.Integer(), nullable=True),
        sa.Column('field_id', sa.Integer(), nullable=True),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('sowing_date', sa.Date(), nullable=True),
        sa.Column('expected_harvest_date', sa.Date(), nullable=True),
        sa.Column('quantity_kg', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ),
        sa.ForeignKeyConstraint(['field_id'], ['farmer_fields.id'], ),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create farmer_cost_tracking table
    op.create_table('farmer_cost_tracking',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('farmer_id', sa.Integer(), nullable=True),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('season', sa.String(length=20), nullable=True),
        sa.Column('cost_category', sa.String(length=50), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create weather_forecasts table
    op.create_table('weather_forecasts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('temp_min', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('temp_max', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('rainfall_mm', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('humidity_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('wind_speed_kmh', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('fetched_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_location_date', 'weather_forecasts', ['location_id', 'date'])
    
    # Create weather_historical table
    op.create_table('weather_historical',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('temp_min', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('temp_max', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('rainfall_mm', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create crop_weather_thresholds table
    op.create_table('crop_weather_thresholds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('crop_id', sa.Integer(), nullable=True),
        sa.Column('stage', sa.String(length=50), nullable=True),
        sa.Column('parameter_name', sa.String(length=50), nullable=True),
        sa.Column('min_value', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('max_value', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('impact_description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create weather_alerts table
    op.create_table('weather_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=True),
        sa.Column('alert_type', sa.String(length=50), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['regions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create insurance_schemes table
    op.create_table('insurance_schemes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('coverage_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('premium_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('provider', sa.String(length=255), nullable=True),
        sa.Column('eligibility_criteria', sa.Text(), nullable=True),
        sa.Column('claim_process', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), server_default=sa.text('1'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create buyer_reviews table
    op.create_table('buyer_reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=True),
        sa.Column('farmer_id', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('verified_purchase', sa.Boolean(), server_default=sa.text('0'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['buyer_id'], ['direct_buyers.id'], ),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create cooperative_societies table
    op.create_table('cooperative_societies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('member_count', sa.Integer(), nullable=True),
        sa.Column('commodities', sa.Text(), nullable=True),
        sa.Column('benefits', sa.Text(), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('cooperative_societies')
    op.drop_table('buyer_reviews')
    op.drop_table('insurance_schemes')
    op.drop_table('weather_alerts')
    op.drop_table('crop_weather_thresholds')
    op.drop_table('weather_historical')
    op.drop_index('idx_location_date', table_name='weather_forecasts')
    op.drop_table('weather_forecasts')
    op.drop_table('farmer_cost_tracking')
    op.drop_table('farmer_crops')
    op.drop_table('farmer_fields')
    op.drop_table('farmers')
    op.drop_table('buyer_commodities')
    op.drop_table('direct_buyers')
    op.drop_table('crop_growth_stages')
    op.drop_table('crop_characteristics')
    op.drop_table('crop_costs')
    op.drop_table('crop_economics')
    op.drop_table('crops')
    op.drop_table('regions')
