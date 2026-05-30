import logging
import numpy as np
from typing import Dict, List, Optional
from .finnhub_client import FinnhubClient
from .data_engine import DataEngine

logger = logging.getLogger(__name__)


class StockScorer:
    """ACO-inspired stock scoring system.

    Each 'ant' evaluates a criterion (fundamental or technical).
    Scores are normalized [0, 1] and combined with configurable weights.
    The composite score acts as a pheromone trail indicating stock quality.
    """

    DEFAULT_WEIGHTS = {
        'value': 0.15,       # PE, PBV valuation
        'profitability': 0.15,  # ROE, profit margin
        'safety': 0.15,      # Debt-to-equity, current ratio
        'momentum': 0.15,    # RSI, MACD signals
        'trend': 0.15,       # Price vs MA, EWMA
        'volatility': 0.10,  # Low volatility preferred
        'performance': 0.10, # 52-week return
        'liquidity': 0.05,   # Volume consistency
    }

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.data_engine = DataEngine(window_size=30)

    def score_stock(self, ticker: str, period: str = "1y") -> Dict:
        try:
            # Fetch fundamental data
            financials = FinnhubClient.get_company_financials(ticker)

            # Fetch price data for technical analysis
            df = self.data_engine.fetch_data(ticker, period=period)
            if df is None or len(df) < 50:
                return {"ticker": ticker, "score": 0, "error": "Insufficient data"}

            df = self.data_engine._add_technical_indicators(df)
            current_price = float(df['Close'].iloc[-1])

            # Compute individual scores
            scores = {}

            # Value score (lower PE/PBV is better)
            scores['value'] = self._score_value(financials)

            # Profitability score
            scores['profitability'] = self._score_profitability(financials)

            # Safety score (lower debt, higher current ratio)
            scores['safety'] = self._score_safety(financials)

            # Momentum score (RSI, MACD)
            scores['momentum'] = self._score_momentum(df)

            # Trend score (price vs MA, EWMA)
            scores['trend'] = self._score_trend(df)

            # Volatility score (lower is better)
            scores['volatility'] = self._score_volatility(df)

            # Performance score (52-week return)
            scores['performance'] = self._score_performance(financials, df)

            # Liquidity score (volume consistency)
            scores['liquidity'] = self._score_liquidity(df)

            # Weighted composite score
            composite = sum(
                scores.get(k, 0) * v for k, v in self.weights.items()
            )

            return {
                "ticker": ticker,
                "score": round(float(composite), 4),
                "grade": self._grade(composite),
                "current_price": current_price,
                "sub_scores": {k: round(float(v), 4) for k, v in scores.items()},
                "financials": financials,
                "signals": self._generate_signals(scores, df, financials, current_price)
            }

        except Exception as e:
            logger.error(f"Error scoring {ticker}: {e}")
            return {"ticker": ticker, "score": 0, "error": str(e)}

    def rank_stocks(self, tickers: List[str], period: str = "1y") -> List[Dict]:
        results = []
        for ticker in tickers:
            result = self.score_stock(ticker, period)
            results.append(result)

        results.sort(key=lambda x: x.get('score', 0), reverse=True)
        for i, r in enumerate(results):
            r['rank'] = i + 1

        return results

    def _score_value(self, fin: Optional[Dict]) -> float:
        """Score based on PE ratio and PBV. Lower is generally better."""
        if not fin:
            return 0.5

        score = 0.5
        pe = fin.get('pe_ratio')
        pb = fin.get('pb_ratio')

        if pe is not None and pe > 0:
            if pe < 15:
                score += 0.25
            elif pe < 25:
                score += 0.1
            elif pe > 40:
                score -= 0.2

        if pb is not None and pb > 0:
            if pb < 1.5:
                score += 0.25
            elif pb < 3:
                score += 0.1
            elif pb > 5:
                score -= 0.2

        return np.clip(score, 0, 1)

    def _score_profitability(self, fin: Optional[Dict]) -> float:
        """Score based on ROE and profit margins."""
        if not fin:
            return 0.5

        score = 0.5
        roe = fin.get('roe')
        margin = fin.get('net_margin')

        if roe is not None:
            if roe > 20:
                score += 0.25
            elif roe > 10:
                score += 0.1
            elif roe < 0:
                score -= 0.3

        if margin is not None:
            if margin > 15:
                score += 0.25
            elif margin > 5:
                score += 0.1
            elif margin < 0:
                score -= 0.3

        return np.clip(score, 0, 1)

    def _score_safety(self, fin: Optional[Dict]) -> float:
        """Score based on debt-to-equity and current ratio."""
        if not fin:
            return 0.5

        score = 0.5
        de = fin.get('debt_to_equity')
        cr = fin.get('current_ratio')

        if de is not None:
            if de < 0.5:
                score += 0.25
            elif de < 1.0:
                score += 0.1
            elif de > 2.0:
                score -= 0.25

        if cr is not None:
            if cr > 2.0:
                score += 0.25
            elif cr > 1.0:
                score += 0.1
            elif cr < 0.8:
                score -= 0.2

        return np.clip(score, 0, 1)

    def _score_momentum(self, df) -> float:
        """Score based on RSI and MACD signals."""
        rsi = float(df['RSI'].iloc[-1])
        macd = float(df['MACD'].iloc[-1])

        score = 0.5

        if 40 <= rsi <= 60:
            score += 0.2
        elif 30 <= rsi <= 70:
            score += 0.1
        elif rsi > 80:
            score -= 0.2
        elif rsi < 20:
            score -= 0.1

        if macd > 0:
            score += 0.2
        else:
            score -= 0.1

        return np.clip(score, 0, 1)

    def _score_trend(self, df) -> float:
        """Score based on price position relative to MAs and EWMA."""
        close = float(df['Close'].iloc[-1])
        ma20 = float(df['MA20'].iloc[-1])
        ma50 = float(df['MA50'].iloc[-1])
        ewma20 = float(df['EWMA20'].iloc[-1])

        score = 0.5

        if close > ma20:
            score += 0.15
        if close > ma50:
            score += 0.15
        if close > ewma20:
            score += 0.1

        if ma20 > ma50:
            score += 0.1

        return np.clip(score, 0, 1)

    def _score_volatility(self, df) -> float:
        """Score based on price volatility. Lower volatility is preferred."""
        returns = df['Close'].pct_change().dropna().iloc[-30:]
        vol = float(returns.std()) if len(returns) > 1 else 0.02

        ann_vol = vol * np.sqrt(252)

        if ann_vol < 0.15:
            return 0.9
        elif ann_vol < 0.25:
            return 0.7
        elif ann_vol < 0.40:
            return 0.5
        elif ann_vol < 0.60:
            return 0.3
        else:
            return 0.1

    def _score_performance(self, fin: Optional[Dict], df) -> float:
        """Score based on 52-week return."""
        if fin and fin.get('52w_return') is not None:
            ret = fin['52w_return']
            if ret > 30:
                return 0.9
            elif ret > 15:
                return 0.7
            elif ret > 0:
                return 0.5
            elif ret > -15:
                return 0.3
            else:
                return 0.1

        # Fallback: compute from price data
        if len(df) >= 252:
            ret = (float(df['Close'].iloc[-1]) / float(df['Close'].iloc[-252]) - 1) * 100
            if ret > 30:
                return 0.9
            elif ret > 0:
                return 0.5
            else:
                return 0.2

        return 0.5

    def _score_liquidity(self, df) -> float:
        """Score based on volume consistency."""
        vol = df['Volume'].iloc[-30:]
        if len(vol) < 10:
            return 0.5

        avg_vol = float(vol.mean())
        std_vol = float(vol.std())
        cv = std_vol / avg_vol if avg_vol > 0 else 1.0

        if cv < 0.3:
            return 0.9
        elif cv < 0.5:
            return 0.7
        elif cv < 0.8:
            return 0.5
        else:
            return 0.3

    def _grade(self, score: float) -> str:
        if score >= 0.8:
            return "A"
        elif score >= 0.65:
            return "B"
        elif score >= 0.5:
            return "C"
        elif score >= 0.35:
            return "D"
        else:
            return "F"

    def _generate_signals(self, scores: Dict, df, financials: Optional[Dict], price: float) -> List[str]:
        signals = []

        if scores.get('value', 0) > 0.7:
            signals.append("Undervalued based on PE/PBV")
        elif scores.get('value', 0) < 0.3:
            signals.append("Potentially overvalued")

        if scores.get('momentum', 0) > 0.7:
            signals.append("Strong bullish momentum")
        elif scores.get('momentum', 0) < 0.3:
            signals.append("Bearish momentum detected")

        if scores.get('trend', 0) > 0.7:
            signals.append("Price above all moving averages")
        elif scores.get('trend', 0) < 0.3:
            signals.append("Price below key moving averages")

        if scores.get('safety', 0) > 0.7:
            signals.append("Strong balance sheet")
        elif scores.get('safety', 0) < 0.3:
            signals.append("High financial risk")

        if scores.get('volatility', 0) > 0.7:
            signals.append("Low volatility (stable)")
        elif scores.get('volatility', 0) < 0.3:
            signals.append("High volatility (risky)")

        return signals
