"""
Selling Strategy Engine - Advises farmers on when to sell their crops for maximum profit
"""

from typing import List, Tuple, Optional, Dict
from datetime import datetime, date, timedelta
from loguru import logger
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.models import (
    MarketPrice,
    SeasonalPricePattern,
    StorageCost,
    PriceVolatility,
    Commodity,
)
from .strategy_models import (
    SellingStrategyInput,
    SellingRecommendation,
    AlternativeSellWindow,
    StrategyType,
)


class SellingStrategyEngine:
    """Engine to calculate optimal selling strategy for farmers"""
    
    # Decision thresholds
    HIGH_VOLATILITY_THRESHOLD = 0.25
    MIN_PROFIT_THRESHOLD = 5000  # Minimum profit to consider waiting
    MEDIUM_PROFIT_THRESHOLD = 15000
    HIGH_PROFIT_THRESHOLD = 25000
    
    # Month names
    MONTH_NAMES = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_selling_strategy(self, inputs: SellingStrategyInput) -> SellingRecommendation:
        """
        Generate comprehensive selling strategy recommendation
        
        Args:
            inputs: Selling strategy input parameters
            
        Returns:
            Complete selling recommendation with financial analysis
        """
        logger.info(f"Generating selling strategy for {inputs.commodity_name} ({inputs.quantity_quintals} quintals)")
        
        # Step 1: Gather data
        historical_prices = self._get_historical_prices(inputs.commodity_id, inputs.market_id)
        seasonal_pattern = self._get_seasonal_pattern(inputs.commodity_id)
        storage_cost_info = self._get_storage_cost(inputs.commodity_id)
        volatility = self._get_or_calculate_volatility(inputs.commodity_id, historical_prices)
        
        # Step 2: Analyze price trend
        price_trend, trend_strength = self._calculate_price_trend(historical_prices)
        
        # Step 3: Find peak season
        peak_month, peak_avg_price = self._get_seasonal_peak(seasonal_pattern, inputs.current_price)
        days_to_peak = self._days_to_month(peak_month) if peak_month else None
        
        # Step 4: Calculate storage costs
        storage_cost_per_day = self._calculate_daily_storage_cost(
            storage_cost_info,
            inputs.quantity_quintals
        )
        
        # Step 5: Check if commodity is perishable
        is_perishable = storage_cost_info.get('perishable', False) if storage_cost_info else False
        max_storage_days = storage_cost_info.get('max_storage_days', 180) if storage_cost_info else 180
        
        # Step 6: Apply decision rules
        strategy, reasoning, confidence = self._decide_strategy(
            price_trend=price_trend,
            trend_strength=trend_strength,
            volatility=volatility,
            is_perishable=is_perishable,
            max_storage_days=max_storage_days,
            days_to_peak=days_to_peak,
            peak_price=peak_avg_price,
            current_price=inputs.current_price,
            storage_cost_per_day=storage_cost_per_day,
            quantity=inputs.quantity_quintals,
        )
        
        # Step 7: Calculate financial projections
        financial_analysis = self._calculate_financial_projections(
            strategy=strategy,
            current_price=inputs.current_price,
            peak_price=peak_avg_price,
            quantity=inputs.quantity_quintals,
            storage_cost_per_day=storage_cost_per_day,
            days_to_peak=days_to_peak if strategy != StrategyType.IMMEDIATE else 0,
        )
        
        # Step 8: Generate alternative windows
        alternatives = self._get_alternative_sell_windows(
            commodity_id=inputs.commodity_id,
            seasonal_pattern=seasonal_pattern,
            current_price=inputs.current_price,
            quantity=inputs.quantity_quintals,
            storage_cost_per_day=storage_cost_per_day,
            max_storage_days=max_storage_days,
            recommended_strategy=strategy,
        )
        
        # Step 9: Generate warnings and tips
        warnings = self._generate_warnings(
            is_perishable=is_perishable,
            volatility=volatility,
            price_trend=price_trend,
            max_storage_days=max_storage_days,
        )
        
        tips = self._generate_tips(
            strategy=strategy,
            volatility=volatility,
            commodity_name=inputs.commodity_name,
        )
        
        # Step 10: Determine risk level
        risk_level = self._calculate_risk_level(volatility, price_trend, is_perishable)
        
        # Step 11: Build recommendation
        recommendation = SellingRecommendation(
            strategy=strategy,
            recommended_action=self._get_action_text(strategy, financial_analysis.get('days_to_wait', 0)),
            reasoning=reasoning,
            confidence_score=confidence,
            current_price=inputs.current_price,
            expected_price=financial_analysis.get('expected_price'),
            price_increase_percent=financial_analysis.get('price_increase_percent'),
            current_revenue=financial_analysis['current_revenue'],
            expected_revenue=financial_analysis.get('expected_revenue'),
            storage_cost=financial_analysis.get('storage_cost'),
            net_profit_gain=financial_analysis.get('net_profit_gain'),
            days_to_wait=financial_analysis.get('days_to_wait'),
            recommended_sell_date=financial_analysis.get('recommended_sell_date'),
            peak_month=peak_month,
            peak_month_name=self.MONTH_NAMES[peak_month] if peak_month else None,
            price_volatility=volatility,
            risk_level=risk_level,
            price_trend=price_trend,
            alternative_windows=alternatives,
            warnings=warnings,
            tips=tips,
        )
        
        logger.info(f"Strategy recommended: {strategy.value} with {confidence:.2f} confidence")
        return recommendation
    
    def _get_historical_prices(
        self, commodity_id: int, market_id: Optional[int] = None, days: int = 180
    ) -> List[Dict]:
        """Fetch historical price data"""
        query = self.db.query(MarketPrice).filter(
            MarketPrice.commodity_id == commodity_id,
            MarketPrice.date >= datetime.now() - timedelta(days=days)
        )
        
        if market_id:
            query = query.filter(MarketPrice.market_id == market_id)
        
        prices = query.order_by(MarketPrice.date).all()
        
        return [
            {
                'date': p.date,
                'price': p.price,
                'arrival': p.arrival or 0,
            }
            for p in prices
        ]
    
    def _get_seasonal_pattern(self, commodity_id: int) -> List[SeasonalPricePattern]:
        """Get seasonal price patterns"""
        return self.db.query(SeasonalPricePattern).filter(
            SeasonalPricePattern.commodity_id == commodity_id
        ).order_by(SeasonalPricePattern.month).all()
    
    def _get_storage_cost(self, commodity_id: int) -> Optional[Dict]:
        """Get storage cost information"""
        storage_cost = self.db.query(StorageCost).filter(
            StorageCost.commodity_id == commodity_id
        ).first()
        
        if storage_cost:
            return {
                'cost_per_quintal_per_month': storage_cost.cost_per_quintal_per_month,
                'max_storage_days': storage_cost.max_storage_days,
                'perishable': storage_cost.perishable,
            }
        
        # Return default values if not in database
        return {
            'cost_per_quintal_per_month': 50.0,  # Default: ₹50 per quintal per month
            'max_storage_days': 180,
            'perishable': False,
        }
    
    def _get_or_calculate_volatility(
        self, commodity_id: int, historical_prices: List[Dict]
    ) -> float:
        """Get volatility score from DB or calculate from historical data"""
        # Try to get from database first
        volatility_record = self.db.query(PriceVolatility).filter(
            PriceVolatility.commodity_id == commodity_id,
            PriceVolatility.period == '90_day'
        ).order_by(desc(PriceVolatility.calculated_at)).first()
        
        if volatility_record:
            return volatility_record.volatility_score
        
        # Calculate from historical prices
        if len(historical_prices) > 30:
            prices = [p['price'] for p in historical_prices[-90:]]
            std_dev = np.std(prices)
            mean_price = np.mean(prices)
            volatility = std_dev / mean_price if mean_price > 0 else 0.2
            return min(volatility, 1.0)  # Cap at 1.0
        
        return 0.2  # Default moderate volatility
    
    def _calculate_price_trend(
        self, historical_prices: List[Dict]
    ) -> Tuple[str, float]:
        """
        Calculate price trend direction and strength
        
        Returns:
            (trend_direction, trend_strength) where:
            - trend_direction: 'INCREASING', 'DECREASING', or 'STABLE'
            - trend_strength: 0-1 indicating how strong the trend is
        """
        if len(historical_prices) < 14:
            return 'STABLE', 0.0
        
        recent_prices = [p['price'] for p in historical_prices[-60:]]
        
        # Simple moving average comparison
        recent_30 = np.mean(recent_prices[-30:])
        older_30 = np.mean(recent_prices[:30]) if len(recent_prices) >= 60 else np.mean(recent_prices)
        
        change_percent = ((recent_30 - older_30) / older_30) * 100 if older_30 > 0 else 0
        
        if change_percent > 5:
            trend = 'INCREASING'
            strength = min(abs(change_percent) / 20.0, 1.0)  # 20% = full strength
        elif change_percent < -5:
            trend = 'DECREASING'
            strength = min(abs(change_percent) / 20.0, 1.0)
        else:
            trend = 'STABLE'
            strength = 0.2
        
        return trend, strength
    
    def _get_seasonal_peak(
        self, seasonal_pattern: List[SeasonalPricePattern], current_price: float
    ) -> Tuple[Optional[int], Optional[float]]:
        """Find the peak price month from seasonal patterns"""
        if not seasonal_pattern:
            return None, None
        
        # Find month with highest average price
        peak = max(seasonal_pattern, key=lambda x: x.avg_price or 0)
        
        return peak.month, peak.avg_price
    
    def _days_to_month(self, target_month: int) -> int:
        """Calculate days from today to the target month"""
        today = datetime.now()
        current_month = today.month
        
        # Calculate months difference
        if target_month >= current_month:
            months_diff = target_month - current_month
        else:
            months_diff = (12 - current_month) + target_month
        
        # Approximate days (using 30 days per month)
        return months_diff * 30
    
    def _calculate_daily_storage_cost(
        self, storage_info: Optional[Dict], quantity: float
    ) -> float:
        """Calculate storage cost per day"""
        if storage_info is None:
            cost_per_month = 50.0  # Default storage cost
        else:
            cost_per_month = storage_info.get('cost_per_quintal_per_month', 50.0)
        return (cost_per_month * quantity) / 30.0  # Convert monthly to daily
    
    def _decide_strategy(
        self,
        price_trend: str,
        trend_strength: float,
        volatility: float,
        is_perishable: bool,
        max_storage_days: int,
        days_to_peak: Optional[int],
        peak_price: Optional[float],
        current_price: float,
        storage_cost_per_day: float,
        quantity: float,
    ) -> Tuple[StrategyType, str, float]:
        """
        Apply decision rules to determine strategy
        
        Returns:
            (strategy_type, reasoning, confidence_score)
        """
        
        # Rule 1: Prices falling fast with high volatility
        if price_trend == 'DECREASING' and volatility > self.HIGH_VOLATILITY_THRESHOLD:
            return (
                StrategyType.IMMEDIATE,
                f"Market prices are declining rapidly (volatility: {volatility:.1%}). "
                f"Selling immediately minimizes potential losses.",
                0.9
            )
        
        # Rule 2: Perishable commodity with distant peak
        if is_perishable and days_to_peak is not None and days_to_peak > max_storage_days:
            return (
                StrategyType.IMMEDIATE,
                f"This commodity is perishable (max storage: {max_storage_days} days). "
                f"Peak season is too far away. Sell now to avoid decay losses.",
                0.85
            )
        
        # Rule 3: Calculate potential profit from waiting
        if days_to_peak is not None and peak_price is not None:
            potential_revenue = peak_price * quantity
            current_revenue = current_price * quantity
            storage_cost = storage_cost_per_day * days_to_peak
            net_profit = (potential_revenue - current_revenue) - storage_cost
            
            # Rule 4: Profit too low or negative
            if net_profit < 0:
                return (
                    StrategyType.IMMEDIATE,
                    f"Storage costs (₹{storage_cost:,.0f}) exceed potential price gains. "
                    f"Selling now is more profitable.",
                    0.8
                )
            
            # Rule 5: Small profit with high risk
            if net_profit < self.MIN_PROFIT_THRESHOLD and volatility > self.HIGH_VOLATILITY_THRESHOLD:
                return (
                    StrategyType.IMMEDIATE,
                    f"Potential profit (₹{net_profit:,.0f}) is too small given high market volatility. "
                    f"The risk of waiting outweighs the potential gain.",
                    0.75
                )
            
            # Rule 6: Good profit, short wait
            if self.MIN_PROFIT_THRESHOLD <= net_profit < self.MEDIUM_PROFIT_THRESHOLD and days_to_peak < 90:
                confidence = 0.8 if volatility < 0.15 else 0.65
                return (
                    StrategyType.WAIT_SHORT,
                    f"Expected profit of ₹{net_profit:,.0f} by waiting {days_to_peak} days. "
                    f"Price trend is {price_trend.lower()} with moderate volatility.",
                    confidence
                )
            
            # Rule 7: Better profit, medium wait
            if self.MEDIUM_PROFIT_THRESHOLD <= net_profit < self.HIGH_PROFIT_THRESHOLD and days_to_peak < 180:
                confidence = 0.85 if price_trend == 'INCREASING' else 0.70
                return (
                    StrategyType.WAIT_MEDIUM,
                    f"Expected profit of ₹{net_profit:,.0f} by waiting {days_to_peak} days. "
                    f"Peak season in {self.MONTH_NAMES[days_to_peak // 30 + datetime.now().month]} "
                    f"offers significantly better prices.",
                    confidence
                )
            
            # Rule 8: Excellent profit, long wait (if not perishable)
            if net_profit >= self.HIGH_PROFIT_THRESHOLD and not is_perishable:
                confidence = 0.75 if volatility < 0.20 else 0.60
                return (
                    StrategyType.WAIT_LONG,
                    f"Exceptional profit potential of ₹{net_profit:,.0f}. "
                    f"Commodity has good shelf life. Consider waiting for peak season.",
                    confidence
                )
        
        # Default: Wait short term
        return (
            StrategyType.WAIT_SHORT,
            f"Market conditions are stable. Consider waiting 2-4 weeks to monitor price trends.",
            0.60
        )
    
    def _calculate_financial_projections(
        self,
        strategy: StrategyType,
        current_price: float,
        peak_price: Optional[float],
        quantity: float,
        storage_cost_per_day: float,
        days_to_peak: int,
    ) -> Dict:
        """Calculate financial projections"""
        current_revenue = current_price * quantity
        
        if strategy == StrategyType.IMMEDIATE:
            return {
                'current_revenue': current_revenue,
                'expected_revenue': None,
                'storage_cost': None,
                'net_profit_gain': None,
                'days_to_wait': 0,
                'recommended_sell_date': None,
                'expected_price': None,
                'price_increase_percent': None,
            }
        
        # Estimate waiting period based on strategy
        if strategy == StrategyType.WAIT_SHORT:
            days_to_wait = min(21, days_to_peak // 2) if days_to_peak else 21
        elif strategy == StrategyType.WAIT_MEDIUM:
            days_to_wait = min(60, days_to_peak // 1.5) if days_to_peak else 60
        else:  # WAIT_LONG
            days_to_wait = min(days_to_peak, 120) if days_to_peak else 90
        
        # Estimate expected price (interpolate to peak)
        price_gain_ratio = days_to_wait / days_to_peak if (days_to_peak is not None and days_to_peak > 0) else 0.5
        expected_price = current_price + ((peak_price or current_price * 1.15) - current_price) * price_gain_ratio
        
        expected_revenue = expected_price * quantity
        storage_cost = storage_cost_per_day * days_to_wait
        net_profit_gain = (expected_revenue - current_revenue) - storage_cost
        price_increase_percent = ((expected_price - current_price) / current_price) * 100
        
        recommended_sell_date = datetime.now().date() + timedelta(days=days_to_wait)
        
        return {
            'current_revenue': current_revenue,
            'expected_revenue': expected_revenue,
            'storage_cost': storage_cost,
            'net_profit_gain': net_profit_gain,
            'days_to_wait': days_to_wait,
            'recommended_sell_date': recommended_sell_date,
            'expected_price': expected_price,
            'price_increase_percent': price_increase_percent,
        }
    
    def _get_alternative_sell_windows(
        self,
        commodity_id: int,
        seasonal_pattern: List[SeasonalPricePattern],
        current_price: float,
        quantity: float,
        storage_cost_per_day: float,
        max_storage_days: int,
        recommended_strategy: StrategyType,
    ) -> List[AlternativeSellWindow]:
        """Generate alternative selling windows"""
        if not seasonal_pattern:
            return []
        
        alternatives = []
        today = datetime.now()
        current_month = today.month
        
        for pattern in seasonal_pattern:
            if pattern.month == current_month:
                continue  # Skip current month
            
            days_to_month = self._days_to_month(pattern.month)
            if days_to_month > max_storage_days or days_to_month < 7:
                continue  # Skip if too far or too soon
            
            expected_price = pattern.avg_price or current_price
            storage_cost = storage_cost_per_day * days_to_month
            expected_revenue = expected_price * quantity
            current_revenue = current_price * quantity
            net_profit = (expected_revenue - current_revenue) - storage_cost
            price_increase = ((expected_price - current_price) / current_price) * 100
            
            # Determine risk level
            if pattern.std_dev and pattern.avg_price:
                cv = pattern.std_dev / pattern.avg_price
                risk = 'HIGH' if cv > 0.2 else 'MEDIUM' if cv > 0.1 else 'LOW'
            else:
                risk = 'MEDIUM'
            
            reason = f"Historical peak for this month"
            if pattern.peak_month:
                reason = f"🌟 Seasonal peak - highest average prices"
            
            alternatives.append(
                AlternativeSellWindow(
                    month=pattern.month,
                    month_name=self.MONTH_NAMES[pattern.month],
                    days_from_now=days_to_month,
                    expected_price=expected_price,
                    price_increase_percent=price_increase,
                    total_storage_cost=storage_cost,
                    net_profit=net_profit,
                    risk_level=risk,
                    reason=reason,
                )
            )
        
        # Sort by net profit (descending) and return top 3
        alternatives.sort(key=lambda x: x.net_profit, reverse=True)
        return alternatives[:3]
    
    def _generate_warnings(
        self,
        is_perishable: bool,
        volatility: float,
        price_trend: str,
        max_storage_days: int,
    ) -> List[str]:
        """Generate relevant warnings"""
        warnings = []
        
        if is_perishable:
            warnings.append(
                f"⚠️ Perishable commodity - Maximum safe storage is {max_storage_days} days. "
                f"Monitor for signs of decay regularly."
            )
        
        if volatility > 0.3:
            warnings.append(
                f"⚠️ High price volatility ({volatility:.1%}) - Market is unpredictable. "
                f"Prices can change significantly in short periods."
            )
        
        if price_trend == 'DECREASING':
            warnings.append(
                "⚠️ Prices are in a declining trend. Consider selling sooner rather than waiting."
            )
        
        return warnings
    
    def _generate_tips(
        self,
        strategy: StrategyType,
        volatility: float,
        commodity_name: str,
    ) -> List[str]:
        """Generate helpful tips"""
        tips = []
        
        if strategy in [StrategyType.WAIT_SHORT, StrategyType.WAIT_MEDIUM, StrategyType.WAIT_LONG]:
            tips.append(
                "💡 Consider advance payment contracts with buyers to lock in good prices early."
            )
            tips.append(
                "💡 Ensure proper storage conditions - temperature and humidity control are crucial."
            )
            tips.append(
                "💡 Monitor daily market prices and be ready to sell if prices unexpectedly spike."
            )
        
        if strategy == StrategyType.IMMEDIATE:
            tips.append(
                "💡 Compare prices across multiple mandis/markets before finalizing the sale."
            )
            tips.append(
                "💡 Check for quality grading - better quality can fetch 5-10% higher prices."
            )
        
        if volatility > 0.25:
            tips.append(
                "💡 High volatility means opportunities - watch the market closely for sudden price jumps."
            )
        
        return tips
    
    def _calculate_risk_level(
        self,
        volatility: float,
        price_trend: str,
        is_perishable: bool,
    ) -> str:
        """Calculate overall risk level"""
        risk_score = 0
        
        # Volatility contribution
        if volatility > 0.3:
            risk_score += 3
        elif volatility > 0.2:
            risk_score += 2
        elif volatility > 0.1:
            risk_score += 1
        
        # Trend contribution
        if price_trend == 'DECREASING':
            risk_score += 2
        elif price_trend == 'STABLE':
            risk_score += 1
        
        # Perishability contribution
        if is_perishable:
            risk_score += 2
        
        if risk_score >= 5:
            return 'HIGH'
        elif risk_score >= 3:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _get_action_text(self, strategy: StrategyType, days: int) -> str:
        """Get clear action text for the strategy"""
        if strategy == StrategyType.IMMEDIATE:
            return "Sell immediately - within next 1-2 days"
        elif strategy == StrategyType.WAIT_SHORT:
            return f"Wait for 2-4 weeks before selling (approximately {days} days)"
        elif strategy == StrategyType.WAIT_MEDIUM:
            return f"Wait for 1-3 months before selling (approximately {days} days)"
        else:  # WAIT_LONG
            return f"Wait for 3+ months for peak season (approximately {days} days)"
