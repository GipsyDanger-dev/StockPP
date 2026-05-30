"""
Finnhub Client - Real-time and historical stock data
Replaces yfinance with Finnhub API for better reliability
"""

import os
import finnhub
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging
import time

logger = logging.getLogger(__name__)


class FinnhubClient:
    """Singleton Finnhub API client for stock data"""

    _instance = None
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            api_key = os.getenv("FINNHUB_API_KEY")
            if not api_key:
                raise ValueError(
                    "Missing FINNHUB_API_KEY. Set it in .env file"
                )
            cls._client = finnhub.Client(api_key=api_key)
            logger.info("Finnhub client initialized")
        return cls._client

    @classmethod
    def get_quote(cls, ticker: str) -> Dict:
        """
        Get real-time quote for a ticker

        Returns dict with: current_price, change, percent_change, high, low, open, prev_close
        """
        try:
            client = cls.get_client()
            quote = client.quote(ticker)

            if not quote or quote.get("c", 0) == 0:
                logger.warning(f"No quote data for {ticker}")
                return None

            return {
                "current_price": quote["c"],
                "change": quote["d"],
                "change_percent": quote["dp"],
                "high": quote["h"],
                "low": quote["l"],
                "open": quote["o"],
                "prev_close": quote["pc"],
                "timestamp": quote.get("t", int(time.time()))
            }
        except Exception as e:
            logger.error(f"Error fetching quote for {ticker}: {e}")
            return None

    @classmethod
    def get_candles(cls, ticker: str, days: int = 365) -> Optional[pd.DataFrame]:
        """
        Get historical candle data for LSTM training

        Args:
            ticker: Stock ticker symbol
            days: Number of days of history

        Returns:
            DataFrame with Date, Open, High, Low, Close, Volume columns
        """
        try:
            client = cls.get_client()

            end = int(datetime.now().timestamp())
            start = int((datetime.now() - timedelta(days=days)).timestamp())

            res = client.stock_candles(ticker, "D", start, end)

            if not res or res.get("s") != "ok":
                logger.warning(f"No candle data for {ticker}")
                return None

            df = pd.DataFrame({
                "Open": res["o"],
                "High": res["h"],
                "Low": res["l"],
                "Close": res["c"],
                "Volume": res["v"]
            }, index=pd.to_datetime(res["t"], unit="s"))

            df.index.name = "Date"
            df = df.sort_index()

            logger.info(f"Fetched {len(df)} candles for {ticker}")
            return df

        except Exception as e:
            logger.error(f"Error fetching candles for {ticker}: {e}")
            return None

    @classmethod
    def get_company_info(cls, ticker: str) -> Optional[Dict]:
        try:
            client = cls.get_client()
            profile = client.company_profile2(symbol=ticker)

            if not profile or not profile.get("name"):
                return None

            return {
                "name": profile.get("name", ticker),
                "sector": profile.get("finnhubIndustry", "Unknown"),
                "country": profile.get("country", "US"),
                "currency": profile.get("currency", "USD"),
                "exchange": profile.get("exchange", ""),
                "logo": profile.get("logo", "")
            }
        except Exception as e:
            logger.error(f"Error fetching company info for {ticker}: {e}")
            return None

    @classmethod
    def search_symbol(cls, query: str) -> list:
        """
        Search for stock symbols matching a query

        Args:
            query: Search query (company name or ticker)

        Returns:
            List of matching symbols with name and type
        """
        try:
            client = cls.get_client()
            result = client.symbol_lookup(query)

            if not result or not result.get("result"):
                return []

            matches = []
            for item in result["result"]:
                if item.get("type") == "Common Stock":
                    matches.append({
                        "symbol": item.get("symbol", ""),
                        "name": item.get("description", ""),
                        "type": item.get("type", ""),
                        "exchange": item.get("displaySymbol", "")
                    })

            return matches[:10]  # Limit to 10 results

        except Exception as e:
            logger.error(f"Error searching symbols for '{query}': {e}")
            return []

    @classmethod
    def get_company_financials(cls, ticker: str) -> Optional[Dict]:
        """Get basic financial metrics from Finnhub (PE, PBV, ROE, etc.)"""
        try:
            client = cls.get_client()
            metrics = client.company_basic_financials(ticker, 'all')

            if not metrics or not metrics.get('metric'):
                return None

            m = metrics['metric']
            return {
                "pe_ratio": m.get('peNormalizedAnnual'),
                "pb_ratio": m.get('pbAnnual'),
                "roe": m.get('roeTTM') or m.get('roeAnnual'),
                "roa": m.get('roaTTM') or m.get('roaAnnual'),
                "gross_margin": m.get('grossMarginTTM') or m.get('grossMarginAnnual'),
                "net_margin": m.get('netProfitMarginTTM') or m.get('netProfitMarginAnnual'),
                "debt_to_equity": m.get('totalDebt/totalEquityAnnual'),
                "current_ratio": m.get('currentRatioAnnual'),
                "dividend_yield": m.get('dividendYieldIndicatedAnnual'),
                "beta": m.get('beta'),
                "52w_high": m.get('52WeekHigh'),
                "52w_low": m.get('52WeekLow'),
                "52w_return": m.get('52WeekPriceReturn'),
                "market_cap": m.get('marketCapitalization')
            }
        except Exception as e:
            logger.error(f"Error fetching financials for {ticker}: {e}")
            return None

    @classmethod
    def get_quote_yfinance(cls, ticker: str) -> Optional[Dict]:
        """
        Fallback: Get quote using yfinance for tickers not supported by Finnhub
        (e.g., Indonesian stocks with .JK suffix)
        """
        try:
            import yfinance as yf

            data = yf.Ticker(ticker)
            history = data.history(period="5d")

            if history.empty:
                return None

            current_price = float(history["Close"].iloc[-1])
            prev_price = float(history["Close"].iloc[-2]) if len(history) > 1 else current_price
            change = current_price - prev_price
            change_percent = (change / prev_price * 100) if prev_price > 0 else 0

            return {
                "current_price": current_price,
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "high": float(history["High"].iloc[-1]),
                "low": float(history["Low"].iloc[-1]),
                "open": float(history["Open"].iloc[-1]),
                "prev_close": prev_price,
                "timestamp": int(history.index[-1].timestamp())
            }
        except Exception as e:
            logger.error(f"Error fetching yfinance quote for {ticker}: {e}")
            return None
