import logging
from typing import Dict, List, Optional
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)


def validate_prediction(prediction: Dict) -> Dict:
    """Validate a single prediction by fetching actual prices and computing metrics"""
    try:
        import yfinance as yf

        ticker = prediction["ticker"]
        predicted_prices = prediction.get("predicted_prices", [])
        current_price = prediction.get("current_price", 0)
        pred_id = prediction["id"]

        if not predicted_prices:
            return {"error": "No predicted prices found"}

        start_date = predicted_prices[0]["date"]
        end_date = predicted_prices[-1]["date"]

        # Add buffer days to ensure we get all dates
        buffer_start = (datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=3)).strftime("%Y-%m-%d")
        buffer_end = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=3)).strftime("%Y-%m-%d")

        ticker_obj = yf.Ticker(ticker)
        hist = ticker_obj.history(start=buffer_start, end=buffer_end)

        if hist.empty:
            return {"error": f"No actual price data available for {ticker}"}

        actual_map = {}
        for idx, row in hist.iterrows():
            d = idx.strftime("%Y-%m-%d")
            actual_map[d] = round(float(row["Close"]), 2)

        actual_prices = []
        errors = []
        percent_errors = []

        for pred_point in predicted_prices:
            pred_date = pred_point["date"]
            pred_price = pred_point["price"]

            # Find actual price (might not be exact date due to weekends/holidays)
            actual_price = None
            for offset in range(0, 4):
                for direction in [0, -1, 1]:
                    check_date = (datetime.strptime(pred_date, "%Y-%m-%d") + timedelta(days=offset * direction)).strftime("%Y-%m-%d")
                    if check_date in actual_map:
                        actual_price = actual_map[check_date]
                        break
                if actual_price is not None:
                    break

            if actual_price is not None:
                actual_prices.append({"date": pred_date, "price": actual_price})
                error = abs(pred_price - actual_price)
                errors.append(error)
                if actual_price > 0:
                    percent_errors.append((error / actual_price) * 100)
            else:
                actual_prices.append({"date": pred_date, "price": None})

        if not errors:
            return {"error": "Could not match any predicted dates with actual prices"}

        mean_absolute_error = sum(errors) / len(errors)
        mean_percent_error = sum(percent_errors) / len(percent_errors) if percent_errors else 0

        valid_actuals = [p for p in actual_prices if p["price"] is not None]
        actual_last_price = valid_actuals[-1]["price"] if valid_actuals else None
        if actual_last_price and actual_last_price > 0:
            actual_change_percent = ((actual_last_price - current_price) / current_price) * 100
            predicted_trend = prediction.get("trend", "")
            actual_trend = "Bullish" if actual_change_percent > 0 else "Bearish"
            direction_correct = predicted_trend == actual_trend
        else:
            actual_change_percent = 0
            direction_correct = False

        return {
            "pred_id": pred_id,
            "actual_prices": actual_prices,
            "actual_change_percent": round(actual_change_percent, 2),
            "direction_correct": direction_correct,
            "mean_absolute_error": round(mean_absolute_error, 4),
            "mean_percent_error": round(mean_percent_error, 4),
            "validated_count": len(errors),
            "total_predicted": len(predicted_prices)
        }

    except Exception as e:
        logger.error(f"Error validating prediction {prediction.get('id', '?')}: {str(e)}")
        return {"error": str(e)}


def batch_validate(predictions: List[Dict]) -> Dict:
    """Validate a batch of predictions"""
    results = {
        "total": len(predictions),
        "validated": 0,
        "failed": 0,
        "details": []
    }

    for pred in predictions:
        result = validate_prediction(pred)
        if "error" in result:
            results["failed"] += 1
            results["details"].append({
                "pred_id": pred.get("id"),
                "ticker": pred.get("ticker"),
                "status": "failed",
                "error": result["error"]
            })
        else:
            results["validated"] += 1
            results["details"].append({
                "pred_id": result["pred_id"],
                "ticker": pred.get("ticker"),
                "status": "validated",
                "mae": result["mean_absolute_error"],
                "mpe": result["mean_percent_error"],
                "direction_correct": result["direction_correct"]
            })

    return results
