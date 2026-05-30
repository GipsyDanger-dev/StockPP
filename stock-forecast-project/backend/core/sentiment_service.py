import os
import time
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

CACHE_TTL = 900  # 15 minutes


class SentimentService:
    def __init__(self):
        self._cache: Dict[str, Dict] = {}
        self._api_key = os.getenv("FINNHUB_API_KEY")

    def _get_client(self):
        if not self._api_key:
            return None
        import finnhub
        return finnhub.Client(api_key=self._api_key)

    def get_sentiment(self, ticker: str) -> Dict:
        ticker = ticker.upper()
        cached = self._cache.get(ticker)
        if cached and (time.time() - cached["_ts"]) < CACHE_TTL:
            return cached

        result = {
            "ticker": ticker,
            "news_score": 0.0,
            "social_score": 0.0,
            "combined_score": 0.0,
            "news_available": False,
            "social_available": False,
            "_ts": time.time()
        }

        client = self._get_client()
        if not client:
            logger.warning("Finnhub API key not set, sentiment unavailable")
            self._cache[ticker] = result
            return result

        try:
            news = client.news_sentiment(ticker)
            if news and news.get("buzz"):
                buzz = news["buzz"]
                news_avg = news.get("sentiment", {})
                if news_avg:
                    bullish = news_avg.get("bullishPercent", 0.5)
                    bearish = news_avg.get("bearishPercent", 0.5)
                    result["news_score"] = round(bullish - bearish, 4)
                    result["news_available"] = True
                    result["news_buzz"] = buzz.get("buzzHigh", 0)
        except Exception as e:
            logger.debug(f"News sentiment unavailable for {ticker}: {e}")

        try:
            social = client.stock_social_sentiment(ticker)
            if social:
                reddit = social.get("reddit", [])
                twitter = social.get("twitter", [])
                scores = []
                if reddit:
                    reddit_pos = sum(r.get("positiveScore", 0) for r in reddit) / len(reddit)
                    reddit_neg = sum(r.get("negativeScore", 0) for r in reddit) / len(reddit)
                    scores.append(reddit_pos - reddit_neg)
                if twitter:
                    twitter_pos = sum(t.get("positiveScore", 0) for t in twitter) / len(twitter)
                    twitter_neg = sum(t.get("negativeScore", 0) for t in twitter) / len(twitter)
                    scores.append(twitter_pos - twitter_neg)
                if scores:
                    result["social_score"] = round(sum(scores) / len(scores), 4)
                    result["social_available"] = True
        except Exception as e:
            logger.debug(f"Social sentiment unavailable for {ticker}: {e}")

        if result["news_available"] and result["social_available"]:
            result["combined_score"] = round(0.6 * result["news_score"] + 0.4 * result["social_score"], 4)
        elif result["news_available"]:
            result["combined_score"] = result["news_score"]
        elif result["social_available"]:
            result["combined_score"] = result["social_score"]

        self._cache[ticker] = result
        logger.info(f"Sentiment for {ticker}: combined={result['combined_score']:.4f} "
                    f"(news={result['news_available']}, social={result['social_available']})")
        return result

    def get_price_adjustment(self, ticker: str) -> float:
        sentiment = self.get_sentiment(ticker)
        score = sentiment.get("combined_score", 0.0)
        max_adj = 0.03
        return 1.0 + max(-max_adj, min(max_adj, score * max_adj))
