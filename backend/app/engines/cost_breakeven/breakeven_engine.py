from .cost_models import CostInput, ProfitabilityReport, CostBreakdown
from typing import List, Dict

class CostBreakevenEngine:
    def analyze_profitability(self, inputs: CostInput) -> ProfitabilityReport:
        total_cost = self._calculate_total_costs(inputs.costs, inputs.hectares)
        gross_revenue = inputs.expected_yield * inputs.current_price * inputs.hectares
        net_profit = gross_revenue - total_cost
        breakeven_price = total_cost / (inputs.expected_yield * inputs.hectares) if inputs.expected_yield > 0 else 0
        breakeven_yield = total_cost / (inputs.current_price * inputs.hectares) if inputs.current_price > 0 else 0
        safety_margins = self._calculate_safety_margins(inputs, total_cost)
        risk_level = self._assess_risk_level(safety_margins)
        alerts = self._generate_alerts(net_profit, breakeven_price, inputs.current_price)
        recommendations = self._get_recommendations(net_profit, breakeven_price, inputs.current_price)
        cost_breakdown = CostBreakdown(total_cost=total_cost, breakdown=inputs.costs)
        return ProfitabilityReport(
            gross_revenue=gross_revenue,
            total_cost=total_cost,
            net_profit=net_profit,
            breakeven_price=breakeven_price,
            breakeven_yield=breakeven_yield,
            safety_margins=safety_margins,
            risk_level=risk_level,
            alerts=alerts,
            recommendations=recommendations,
            cost_breakdown=cost_breakdown
        )

    def _calculate_total_costs(self, costs: List[Dict], hectares: float) -> float:
        return sum(item['amount'] for item in costs) * hectares

    def _calculate_safety_margins(self, inputs: CostInput, total_cost: float) -> Dict:
        breakeven_price = total_cost / (inputs.expected_yield * inputs.hectares) if inputs.expected_yield > 0 else 0
        price_buffer = (inputs.current_price - breakeven_price) / breakeven_price if breakeven_price > 0 else 0
        breakeven_yield = total_cost / (inputs.current_price * inputs.hectares) if inputs.current_price > 0 else 0
        yield_buffer = (inputs.expected_yield - breakeven_yield) / breakeven_yield if breakeven_yield > 0 else 0
        return {
            'price_buffer_pct': price_buffer * 100,
            'yield_buffer_pct': yield_buffer * 100
        }

    def _assess_risk_level(self, safety_margins: Dict) -> str:
        price_buffer = safety_margins.get('price_buffer_pct', 0)
        yield_buffer = safety_margins.get('yield_buffer_pct', 0)
        if price_buffer > 25 and yield_buffer > 25:
            return 'LOW'
        elif price_buffer < 10 or yield_buffer < 10:
            return 'HIGH'
        else:
            return 'MODERATE'

    def _generate_alerts(self, net_profit: float, breakeven_price: float, current_price: float) -> List[str]:
        alerts = []
        if net_profit < 0:
            alerts.append('Critical: Net profit is negative!')
        elif net_profit < 10000:
            alerts.append('Warning: Net profit is less than ₹10,000.')
        if current_price <= breakeven_price * 1.1:
            alerts.append('Warning: Current price is only 10% above breakeven.')
        return alerts

    def _get_recommendations(self, net_profit: float, breakeven_price: float, current_price: float) -> List[str]:
        if net_profit < 0:
            return ["Don't sow, switch crop"]
        elif net_profit < 10000:
            return ["Reduce costs or wait for better prices"]
        else:
            risks = []
            if current_price <= breakeven_price * 1.1:
                risks.append('Price close to breakeven')
            return ["Proceed with caution" + (f" on these risks: {', '.join(risks)}" if risks else '')]
