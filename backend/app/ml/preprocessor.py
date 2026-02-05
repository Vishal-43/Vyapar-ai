
from typing import Tuple, List, Dict, Optional, Any
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from loguru import logger

from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer

from app.core.utils import get_current_timestamp
from app.core.festival_calendar import FestivalCalendar

class DataPreprocessor:

    def __init__(self, scaler_type: str = "standard"):
        
        self.scaler_type = scaler_type
        self.scalers: Dict[str, StandardScaler] = {}
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.imputer = SimpleImputer(strategy="median")
        self.feature_names: List[str] = []
        self.categorical_features: List[str] = []
        self.numeric_features: List[str] = []
        self.festival_calendar = FestivalCalendar()

        logger.info(f"Preprocessor ready with {scaler_type} scaling and festival integration")

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period, min_periods=1).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period, min_periods=1).mean()
        rs = gain / (loss + 1e-10)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50.0)

    def _get_scaler(self, scaler_type: str) -> Any:
        if scaler_type == "standard":
            return StandardScaler()
        elif scaler_type == "minmax":
            return MinMaxScaler()
        elif scaler_type == "robust":
            return RobustScaler()
        else:
            return StandardScaler()

    def extract_temporal_features(self, date_col: pd.Series) -> pd.DataFrame:
        
        features = pd.DataFrame()
        dates = pd.to_datetime(date_col)
        
        features['day_of_week'] = dates.dt.dayofweek
        features['day_of_month'] = dates.dt.day
        features['month'] = dates.dt.month
        features['quarter'] = dates.dt.quarter
        features['week_of_year'] = dates.dt.isocalendar().week
        features['day_of_year'] = dates.dt.dayofyear
        
        def get_season(month: int) -> int:
            if month in [10, 11, 12, 1, 2, 3]:
                return 1
            elif month in [6, 7, 8, 9]:
                return 2
            else:
                return 3
        
        features['season'] = dates.dt.month.map(get_season)
        
        features['month_sin'] = np.sin(2 * np.pi * dates.dt.month / 12)
        features['month_cos'] = np.cos(2 * np.pi * dates.dt.month / 12)
        features['day_sin'] = np.sin(2 * np.pi * dates.dt.day / 31)
        features['day_cos'] = np.cos(2 * np.pi * dates.dt.day / 31)
        
        festival_features = dates.apply(
            lambda d: pd.Series(self.festival_calendar.get_enhanced_features(d))
        )
        
        for col in festival_features.columns:
            features[col] = festival_features[col]
        
        return features

    def extract_lag_features(
        self, data: pd.DataFrame, col: str, lags: List[int] = None
    ) -> pd.DataFrame:

        if lags is None:
            lags = [1, 7, 30]

        features = pd.DataFrame()
        
        for lag in lags:
            features[f'{col}_lag_{lag}'] = data[col].shift(lag)

        for window in [7, 30]:
            features[f'{col}_rolling_mean_{window}'] = (
                data[col].rolling(window=window).mean()
            )
            features[f'{col}_rolling_std_{window}'] = (
                data[col].rolling(window=window).std()
            )
            features[f'{col}_rolling_min_{window}'] = (
                data[col].rolling(window=window).min()
            )
            features[f'{col}_rolling_max_{window}'] = (
                data[col].rolling(window=window).max()
            )

        features[f'{col}_ewm_mean'] = data[col].ewm(span=7).mean()

        return features

    def detect_outliers(
        self, data: np.ndarray, method: str = "iqr", threshold: float = 1.5
    ) -> np.ndarray:

        if method == "iqr":
            q1 = np.percentile(data, 25)
            q3 = np.percentile(data, 75)
            iqr = q3 - q1
            lower = q1 - threshold * iqr
            upper = q3 + threshold * iqr
            return (data < lower) | (data > upper)
        else:
            z_scores = np.abs((data - np.mean(data)) / np.std(data))
            return z_scores > threshold

    def handle_outliers(
        self, data: np.ndarray, method: str = "iqr", strategy: str = "clip"
    ) -> np.ndarray:

        outlier_mask = self.detect_outliers(data, method)
        
        if strategy == "remove":
            return data[~outlier_mask]
        elif strategy == "clip":
            q1 = np.percentile(data, 25)
            q3 = np.percentile(data, 75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            return np.clip(data, lower, upper)
        else:
            median = np.median(data[~outlier_mask])
            data[outlier_mask] = median
            return data

    def encode_categorical(
        self, data: pd.DataFrame, categorical_cols: List[str], fit: bool = True
    ) -> pd.DataFrame:

        data_encoded = data.copy()
        
        for col in categorical_cols:
            if fit:
                self.label_encoders[col] = LabelEncoder()
                data_encoded[col] = self.label_encoders[col].fit_transform(
                    data_encoded[col].astype(str)
                )
            else:
                if col in self.label_encoders:
                    data_encoded[col] = self.label_encoders[col].transform(
                        data_encoded[col].astype(str)
                    )

        return data_encoded

    def scale_features(
        self, data: np.ndarray, feature_name: str, fit: bool = True
    ) -> np.ndarray:

        try:
            data_2d = data.reshape(-1, 1) if data.ndim == 1 else data
            
            if data_2d.std() == 0:
                logger.debug(f"Feature {feature_name} has zero variance, returning as-is")
                return data_2d.flatten() if data.ndim == 1 else data_2d
            
            if fit:
                self.scalers[feature_name] = self._get_scaler(self.scaler_type)
                scaled = self.scalers[feature_name].fit_transform(data_2d)
            else:
                if feature_name in self.scalers:
                    scaled = self.scalers[feature_name].transform(data_2d)
                else:
                    logger.debug(f"Scaler for {feature_name} not found, using input data")
                    scaled = data_2d

            return scaled.flatten() if data.ndim == 1 else scaled
        except Exception as e:
            logger.warning(f"Error scaling {feature_name}: {e}, returning input data")
            return data

    def prepare_training_data(
        self,
        data: pd.DataFrame,
        target_col: str,
        date_col: str,
        categorical_cols: List[str] = None,
        numeric_cols: List[str] = None,
        handle_missing: bool = True,
        handle_outliers_: bool = True,
    ) -> Tuple[np.ndarray, np.ndarray]:

        data_processed = data.copy()

        if handle_missing and data_processed.isnull().any().any():
            numeric_cols_to_impute = (
                numeric_cols or data_processed.select_dtypes(include=[np.number]).columns.tolist()
            )
            data_processed[numeric_cols_to_impute] = self.imputer.fit_transform(
                data_processed[numeric_cols_to_impute]
            )
            logger.info(f"Handled missing values in {len(numeric_cols_to_impute)} columns")

        temporal_features = self.extract_temporal_features(data_processed[date_col])

        # Calculate trader features BEFORE encoding categorical columns
        # so we can access original string values
        trader_features = self.calculate_trader_features(data_processed)

        if categorical_cols:
            data_processed = self.encode_categorical(
                data_processed, categorical_cols, fit=True
            )

        if numeric_cols is None:
            numeric_cols = data_processed.select_dtypes(include=[np.number]).columns.tolist()
            if target_col in numeric_cols:
                numeric_cols.remove(target_col)

        if handle_outliers_:
            for col in numeric_cols:
                data_processed[col] = self.handle_outliers(
                    data_processed[col].values, strategy="clip"
                )

        feature_cols = numeric_cols + (categorical_cols or [])
        features = data_processed[feature_cols].copy()
        
        features = pd.concat([features, temporal_features], axis=1)
        
        # Concat trader features (calculated before encoding)
        features = pd.concat([features, trader_features], axis=1)
        
        # Fill any NaNs before scaling
        features = features.fillna(0)
        
        for col in numeric_cols:
            if col in features.columns:
                features[col] = self.scale_features(features[col].values, col, fit=True)

        self.feature_names = features.columns.tolist()
        self.numeric_features = numeric_cols
        self.categorical_features = categorical_cols or []

        target = data_processed[target_col].values

        # Convert to numeric
        features = features.apply(pd.to_numeric, errors="coerce")
        features = features.fillna(0)  # Fill any remaining NaNs

        # Only filter rows where target is NaN
        valid_idx = ~pd.isna(target)
        features = features.to_numpy()[valid_idx]
        target = target[valid_idx]

        logger.info(
            f"Prepared training data: {features.shape[0]} samples, {features.shape[1]} features"
        )

        return features, target

    def calculate_trader_features(self, data: pd.DataFrame) -> pd.DataFrame:
        
        trader_features = pd.DataFrame()
        
        if 'price' in data.columns and len(data) > 1:
            trader_features['price_volatility'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: x.rolling(window=min(7, len(x)), min_periods=1).std().fillna(0)
            )
        else:
            trader_features['price_volatility'] = 0.0
        
        if 'arrival' in data.columns and len(data) > 1:
            trader_features['arrival_momentum'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: x.diff().fillna(0)
            )
        else:
            trader_features['arrival_momentum'] = 0.0
        
        if 'day_of_week' in data.columns:
            trader_features['weekend_effect'] = data['day_of_week'].apply(
                lambda x: 1.0 if x >= 5 else 0.0
            )
        else:
            trader_features['weekend_effect'] = 0.0
        
        if 'market_id' in data.columns:
            market_sizes = {i: 1.0 + (i % 5) * 0.2 for i in range(50)}
            trader_features['market_size_factor'] = data['market_id'].map(
                lambda x: market_sizes.get(int(x) if pd.notna(x) else 0, 1.0)
            )
        else:
            trader_features['market_size_factor'] = 1.0
        
        commodity_shelf_life = {
            'wheat': 12, 'rice': 12, 'maize': 6, 'barley': 12, 'soybean': 12,
            'chickpea': 12, 'pigeon_pea': 12, 'lentil': 12, 'green_gram': 12,
            'black_gram': 12, 'kidney_bean': 12, 'mustard': 12, 'groundnut': 6,
            'sunflower': 6, 'sesame': 12, 'cotton': 12, 'jute': 12,
        }
        if 'commodity' in data.columns:
            try:
                # Try to handle string commodities
                if data['commodity'].dtype == 'object':
                    trader_features['commodity_shelf_life'] = data['commodity'].str.lower().str.replace(' ', '_').map(
                        lambda x: commodity_shelf_life.get(x, 3) / 12.0
                    )
                else:
                    # Already encoded, use default
                    trader_features['commodity_shelf_life'] = 0.5
            except:
                trader_features['commodity_shelf_life'] = 0.5
        else:
            trader_features['commodity_shelf_life'] = 0.5
        
        if 'price' in data.columns and 'arrival' in data.columns:
            trader_features['price_to_arrival_ratio'] = data.apply(
                lambda row: row['price'] / (row['arrival'] + 1) if pd.notna(row['arrival']) and row['arrival'] > 0 else 0.0,
                axis=1
            )
        else:
            trader_features['price_to_arrival_ratio'] = 0.0
        
        if 'month' in data.columns:
            peak_seasons = {10: 1.3, 11: 1.4, 12: 1.5, 1: 1.3, 2: 1.1, 3: 1.0,
                          4: 0.9, 5: 0.9, 6: 1.1, 7: 1.2, 8: 1.2, 9: 1.1}
            trader_features['seasonal_demand_index'] = data['month'].map(
                lambda x: peak_seasons.get(int(x) if pd.notna(x) else 1, 1.0)
            )
        else:
            trader_features['seasonal_demand_index'] = 1.0
        
        if 'is_festival' in data.columns and 'festival_effect' in data.columns:
            trader_features['festival_demand_multiplier'] = data.apply(
                lambda row: 1.0 + (row['festival_effect'] * 0.5) if row['is_festival'] > 0 else 1.0,
                axis=1
            )
        else:
            trader_features['festival_demand_multiplier'] = 1.0
        
        if 'arrival' in data.columns and len(data) > 7:
            trader_features['supply_shock_indicator'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: ((x - x.rolling(window=min(7, len(x)), min_periods=1).mean()) / 
                          (x.rolling(window=min(7, len(x)), min_periods=1).std() + 1)).fillna(0).clip(-3, 3)
            )
        else:
            trader_features['supply_shock_indicator'] = 0.0
        
        if 'price' in data.columns and len(data) > 30:
            trader_features['demand_trend'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: (x.rolling(window=min(30, len(x)), min_periods=1).mean() - 
                          x.rolling(window=min(60, len(x)), min_periods=1).mean()).fillna(0)
            )
        else:
            trader_features['demand_trend'] = 0.0
        
        if 'market_id' in data.columns:
            market_competition = {i: 0.5 + (i % 10) * 0.05 for i in range(50)}
            trader_features['market_competition_index'] = data['market_id'].map(
                lambda x: market_competition.get(int(x) if pd.notna(x) else 0, 0.5)
            )
        else:
            trader_features['market_competition_index'] = 0.5
        
        if 'price' in data.columns and len(data) > 14:
            trader_features['volatility_14d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: x.rolling(window=min(14, len(x)), min_periods=1).std().fillna(0)
            )
        else:
            trader_features['volatility_14d'] = 0.0
        
        if 'price' in data.columns and len(data) > 7:
            trader_features['momentum_7d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: (x - x.shift(min(7, len(x)-1))).fillna(0)
            )
        else:
            trader_features['momentum_7d'] = 0.0
        
        if 'price' in data.columns and len(data) > 30:
            trader_features['rsi_30d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: self._calculate_rsi(x, min(30, len(x)))
            )
        else:
            trader_features['rsi_30d'] = 50.0
        
        if 'arrival' in data.columns and len(data) > 14:
            trader_features['supply_volatility'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: x.rolling(window=min(14, len(x)), min_periods=1).std().fillna(0) / (x.rolling(window=min(14, len(x)), min_periods=1).mean().fillna(1) + 1)
            )
        else:
            trader_features['supply_volatility'] = 0.0
        
        if 'price' in data.columns and 'arrival' in data.columns and len(data) > 7:
            price_pct = data.groupby(['commodity_id'])['price'].pct_change().fillna(0)
            arrival_pct = data.groupby(['commodity_id'])['arrival'].pct_change().fillna(0)
            trader_features['price_elasticity'] = ((price_pct + 1e-6) / (arrival_pct + 1e-6)).clip(-10, 10).fillna(0)
        else:
            trader_features['price_elasticity'] = 0.0
        
        trader_features['is_peak_season'] = trader_features['seasonal_demand_index'].apply(
            lambda x: 1.0 if x > 1.2 else 0.0
        )
        
        if 'month' in data.columns:
            trader_features['harvest_season'] = data['month'].apply(
                lambda m: 1.0 if m in [10, 11, 12, 1, 2] else 0.0
            )
        else:
            trader_features['harvest_season'] = 0.0
        
        # Weather features if available
        weather_cols = [
            'weather_temperature', 'weather_humidity', 'weather_rainfall',
            'weather_temp_range', 'weather_heat_stress', 'weather_cold_stress',
            'weather_drought_indicator', 'weather_flood_risk',
            'weather_uncertainty', 'weather_temp_volatility', 'weather_rainfall_volatility'
        ]
        for col in weather_cols:
            if col in data.columns:
                trader_features[f'{col}_impact'] = data[col]
        
        # Weather-price interaction features
        if 'weather_temperature' in data.columns and 'price' in data.columns:
            trader_features['temp_price_interaction'] = data['weather_temperature'] * data.get('seasonal_demand_index', 1.0)
        
        if 'weather_rainfall' in data.columns:
            trader_features['rainfall_supply_shock'] = data['weather_rainfall'].apply(
                lambda r: 1.0 if r > 50 else 0.0
            )
        
        if 'price' in data.columns and len(data) > 90:
            trader_features['price_trend_90d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: (x.rolling(window=min(30, len(x)), min_periods=1).mean() - 
                          x.rolling(window=min(90, len(x)), min_periods=1).mean()).fillna(0)
            )
        else:
            trader_features['price_trend_90d'] = 0.0
        
        if 'market_id' in data.columns:
            market_premium = {i: 1.0 + ((i % 20) - 10) * 0.02 for i in range(50)}
            trader_features['market_premium_factor'] = data['market_id'].map(
                lambda x: market_premium.get(int(x) if pd.notna(x) else 0, 1.0)
            )
        else:
            trader_features['market_premium_factor'] = 1.0
        
        if 'arrival' in data.columns and len(data) > 7:
            trader_features['supply_consistency'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: 1.0 / (x.rolling(window=min(7, len(x)), min_periods=1).std().fillna(1) + 1)
            )
        else:
            trader_features['supply_consistency'] = 0.5
        
        return trader_features
        if 'price' in data.columns and len(data) > 60:
            trader_features['price_deviation_60d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: ((x - x.rolling(window=min(60, len(x)), min_periods=1).mean()) / 
                          (x.rolling(window=min(60, len(x)), min_periods=1).std() + 1)).fillna(0)
            )
        else:
            trader_features['price_deviation_60d'] = 0.0
        
        trader_features['quarter_demand_weight'] = data.get('quarter', pd.Series([1]*len(data))).map(
            {1: 0.9, 2: 1.0, 3: 1.1, 4: 1.3}
        ).fillna(1.0)
        
        trader_features['storage_cost_factor'] = trader_features['commodity_shelf_life'] * 0.8
        
        if 'commodity_shelf_life' in trader_features.columns:
            trader_features['storage_cost_factor'] = trader_features['commodity_shelf_life'].apply(
                lambda x: 0.1 if x > 0.8 else 0.3 if x > 0.5 else 0.5
            )
        else:
            trader_features['storage_cost_factor'] = 0.3
        
        if 'market_id' in data.columns:
            transport_difficulty = {i: 0.2 + (i % 8) * 0.1 for i in range(50)}
            trader_features['transportation_difficulty'] = data['market_id'].map(
                lambda x: transport_difficulty.get(int(x) if pd.notna(x) else 0, 0.5)
            )
        else:
            trader_features['transportation_difficulty'] = 0.5
        
        if 'price' in data.columns and 'min_price' in data.columns and 'max_price' in data.columns:
            trader_features['price_spread'] = data.apply(
                lambda row: (row['max_price'] - row['min_price']) / (row['price'] + 1) 
                if pd.notna(row['max_price']) and pd.notna(row['min_price']) else 0.0,
                axis=1
            )
        else:
            trader_features['price_spread'] = 0.0
        
        if 'price' in data.columns and len(data) > 14:
            trader_features['price_momentum_14d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: (x / x.rolling(window=min(14, len(x)), min_periods=1).mean()).fillna(1.0) - 1.0
            )
        else:
            trader_features['price_momentum_14d'] = 0.0
        
        if 'arrival' in data.columns and len(data) > 14:
            trader_features['arrival_trend_14d'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: (x.rolling(window=min(14, len(x)), min_periods=1).mean() / 
                          x.rolling(window=min(28, len(x)), min_periods=1).mean()).fillna(1.0) - 1.0
            )
        else:
            trader_features['arrival_trend_14d'] = 0.0
        
        if 'quarter' in data.columns:
            harvest_quarters = {1: 1.3, 2: 0.9, 3: 1.1, 4: 1.4}
            trader_features['harvest_season_indicator'] = data['quarter'].map(
                lambda x: harvest_quarters.get(int(x) if pd.notna(x) else 1, 1.0)
            )
        else:
            trader_features['harvest_season_indicator'] = 1.0
        
        if 'price' in data.columns and len(data) > 3:
            trader_features['price_acceleration'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: x.diff().diff().fillna(0)
            )
        else:
            trader_features['price_acceleration'] = 0.0
        
        if 'arrival' in data.columns and 'price' in data.columns:
            trader_features['supply_pressure'] = data.apply(
                lambda row: (row['arrival'] / (row['arrival'].rolling(window=7, min_periods=1).mean() + 1))
                if hasattr(row['arrival'], 'rolling') else 1.0,
                axis=1
            )
        else:
            trader_features['supply_pressure'] = 1.0
        
        if 'commodity_id' in data.columns:
            commodity_liquidity = {i: 0.6 + (i % 7) * 0.05 for i in range(100)}
            trader_features['market_liquidity'] = data['commodity_id'].map(
                lambda x: commodity_liquidity.get(int(x) if pd.notna(x) else 0, 0.8)
            )
        else:
            trader_features['market_liquidity'] = 0.8
        
        if 'month' in data.columns:
            trader_features['monsoon_effect'] = data['month'].apply(
                lambda x: 1.2 if x in [6, 7, 8, 9] else 1.0
            )
        else:
            trader_features['monsoon_effect'] = 1.0
        
        if 'price' in data.columns and len(data) > 30:
            trader_features['price_range_30d'] = data.groupby(['commodity_id'])['price'].transform(
                lambda x: (x.rolling(window=min(30, len(x)), min_periods=1).max() - 
                          x.rolling(window=min(30, len(x)), min_periods=1).min()).fillna(0)
            )
        else:
            trader_features['price_range_30d'] = 0.0
        
        if 'arrival' in data.columns:
            trader_features['supply_consistency'] = data.groupby(['commodity_id'])['arrival'].transform(
                lambda x: 1.0 / (x.rolling(window=min(7, len(x)), min_periods=1).std() + 1)
            )
        else:
            trader_features['supply_consistency'] = 1.0
        
        if 'price' in data.columns and 'market_id' in data.columns:
            trader_features['price_premium_to_avg'] = data.groupby(['commodity_id', 'market_id'])['price'].transform(
                lambda x: (x / x.mean()).fillna(1.0) - 1.0
            )
        else:
            trader_features['price_premium_to_avg'] = 0.0
        
        if 'day_of_month' in data.columns:
            trader_features['month_start_effect'] = data['day_of_month'].apply(
                lambda x: 1.1 if x <= 7 else 1.0 if x <= 14 else 0.95
            )
        else:
            trader_features['month_start_effect'] = 1.0
        
        if 'price' in data.columns and 'arrival' in data.columns and len(data) > 7:
            trader_features['inventory_pressure'] = data.apply(
                lambda row: row['price'] * row['arrival'] / 1000.0 
                if pd.notna(row['arrival']) else 0.0,
                axis=1
            )
        else:
            trader_features['inventory_pressure'] = 0.0
        
        return trader_features

    def prepare_prediction_data(
        self, data: pd.DataFrame, date_col: str, categorical_cols: List[str] = None
    ) -> np.ndarray:

        data_processed = data.copy()

        temporal_features = self.extract_temporal_features(data_processed[date_col])

        features = pd.DataFrame()
        
        numeric_cols = ['price', 'min_price', 'max_price', 'modal_price', 'arrival', 'commodity_id', 'market_id']
        for col in numeric_cols:
            if col in data_processed.columns:
                features[col] = data_processed[col]
            else:
                # Derive from price if available
                if col == 'min_price' and 'price' in data_processed.columns:
                    features[col] = data_processed['price'] * 0.9
                elif col == 'max_price' and 'price' in data_processed.columns:
                    features[col] = data_processed['price'] * 1.1
                elif col == 'modal_price' and 'price' in data_processed.columns:
                    features[col] = data_processed['price']
                else:
                    features[col] = 0.0
        
        features = pd.concat([features, temporal_features], axis=1)
        
        if 'commodity' in data_processed.columns:
            features['commodity'] = data_processed['commodity']
        
        trader_features = self.calculate_trader_features(features)
        features = pd.concat([features, trader_features], axis=1)
        
        # Use the exact same features as during training (fallback to standard list)
        standard_features = [
            'price',
            'min_price',
            'max_price',
            'modal_price',
            'arrival',
            'commodity_id',
            'market_id',
            'day_of_week',
            'day_of_month',
            'month',
            'quarter',
            'week_of_year',
            'day_of_year',
            'season',
            'month_sin',
            'month_cos',
            'day_sin',
            'day_cos',
            'is_festival',
            'festival_effect',
            'days_to_festival',
            'holiday_proximity',
            'monsoon_factor',
            'harvest_season',
            'price_volatility',
            'arrival_momentum',
            'weekend_effect',
            'market_size_factor',
            'commodity_shelf_life',
            'price_to_arrival_ratio',
            'seasonal_demand_index',
            'festival_demand_multiplier',
            'supply_shock_indicator',
            'demand_trend',
            'market_competition_index',
            'volatility_14d',
            'momentum_7d',
            'rsi_30d',
            'supply_volatility',
            'price_elasticity',
            'is_peak_season',
            'price_trend_90d',
            'market_premium_factor',
        ]

        model_features = self.feature_names if self.feature_names else standard_features

        for col in model_features:
            if col not in features.columns:
                features[col] = 0.0

        features = features[model_features].copy()
        
        # Scale numeric features
        for col in ['price', 'min_price', 'max_price', 'modal_price', 'arrival']:
            if col in features.columns:
                try:
                    values = features[col].values
                    scaled = self.scale_features(values, col, fit=False)
                    if scaled is not None:
                        features[col] = scaled
                except Exception as e:
                    logger.debug(f"Could not scale {col}: {e}, using raw values")

        features = features.fillna(features.mean(numeric_only=True))
        features = features.fillna(0.0)
        
        self.feature_names = model_features
        
        features_array = features.values

        logger.info(f"Prepared prediction data: shape={features_array.shape}, features={len(self.feature_names)}")

        return features_array

    def get_feature_importance_baseline(self, features: np.ndarray) -> Dict[str, float]:

        feature_variance = np.var(features, axis=0)
        total_variance = np.sum(feature_variance)
        
        # Handle zero variance case (e.g., single sample)
        if total_variance == 0:
            n_features = len(self.feature_names)
            return {name: 1.0 / n_features for name in self.feature_names}
        
        importance = {
            name: float(variance / total_variance)
            for name, variance in zip(self.feature_names, feature_variance)
        }
        
        return importance
