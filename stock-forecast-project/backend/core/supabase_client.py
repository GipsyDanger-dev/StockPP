import os
import logging
import secrets
import string
import time
import hashlib
from collections import defaultdict
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

class SupabaseClient:
    """Singleton Supabase client wrapper"""

    _instance: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance"""
        if cls._instance is None:
            cls._instance = cls._initialize_client()
        return cls._instance

    @classmethod
    def _initialize_client(cls) -> Client:
        try:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")

            if not url or not key:
                raise ValueError(
                    "Missing Supabase credentials. "
                    "Set SUPABASE_URL and SUPABASE_KEY in .env file"
                )

            client = create_client(url, key)
            logger.info("Supabase client initialized successfully")
            return client

        except Exception as e:
            logger.error(f"Error initializing Supabase client: {str(e)}")
            raise

    @classmethod
    def get_db(cls):
        """Get database client for table operations"""
        return cls.get_client()

    @classmethod
    def get_storage(cls):
        """Get storage client for file operations"""
        return cls.get_client().storage


def init_database_tables():
    """Initialize required database tables (tickers, training_logs)"""
    client = SupabaseClient.get_client()

    try:
        result = client.table("tickers").select("count").execute()
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.warning(f"Database tables may not exist yet: {str(e)}")
        logger.info("Please run the SQL schema in Supabase dashboard")
        return False


def ensure_ticker_exists(symbol: str, name: str = None) -> bool:
    """Ensure a ticker exists in the tickers table (upsert if not found)"""
    try:
        client = SupabaseClient.get_client()

        existing = client.table("tickers").select("symbol").eq("symbol", symbol).execute()
        if existing.data:
            return True

        client.table("tickers").upsert({
            "symbol": symbol,
            "name": name or symbol,
            "is_active": True
        }, on_conflict="symbol").execute()

        logger.info(f"Ticker ensured: {symbol}")
        return True

    except Exception as e:
        logger.warning(f"Could not ensure ticker {symbol}: {str(e)}")
        return False

def insert_training_log(ticker: str, report_name: str, rmse: float, mae: float,
                       status: str = "Completed") -> dict:
    """Insert a training log entry into database"""
    try:
        client = SupabaseClient.get_client()

        # FK constraint - ensure ticker exists
        ensure_ticker_exists(ticker)

        result = client.table("training_logs").insert({
            "ticker": ticker,
            "report_name": report_name,
            "rmse": rmse,
            "mae": mae,
            "status": status
        }).execute()

        logger.info(f"Training log inserted for {ticker}")
        return result.data[0] if result.data else {}

    except Exception as e:
        logger.error(f"Error inserting training log: {str(e)}")
        raise

def get_all_tickers() -> list:
    """Get all active tickers from database"""
    try:
        client = SupabaseClient.get_client()

        result = client.table("tickers").select("*").eq("is_active", True).execute()

        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching tickers: {str(e)}")
        return []

def get_training_logs(ticker: Optional[str] = None, limit: int = 100) -> list:
    """Get training logs from database"""
    try:
        client = SupabaseClient.get_client()

        query = client.table("training_logs").select("*").order("created_at", desc=True).limit(limit)

        if ticker:
            query = query.eq("ticker", ticker)

        result = query.execute()

        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching training logs: {str(e)}")
        return []


def get_all_articles(status: Optional[str] = None, limit: int = 50) -> list:
    """Get articles from database"""
    try:
        client = SupabaseClient.get_client()

        query = client.table("articles").select("*").order("created_at", desc=True).limit(limit)

        if status:
            query = query.eq("status", status)

        result = query.execute()

        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching articles: {str(e)}")
        return []

def get_article_by_id(article_id: str) -> Optional[dict]:
    """Get a single article by ID"""
    try:
        client = SupabaseClient.get_client()

        result = client.table("articles").select("*").eq("id", article_id).execute()

        return result.data[0] if result.data else None

    except Exception as e:
        logger.error(f"Error fetching article: {str(e)}")
        return None

def create_article(title: str, content: str, category: str = "Market Analysis",
                   summary: str = "", author: str = "Admin", status: str = "draft",
                   image_url: str = None, header_image: str = None, thumbnail: str = None,
                   tags: list = None) -> dict:
    """Create a new article"""
    try:
        client = SupabaseClient.get_client()

        article_data = {
            "title": title,
            "content": content,
            "category": category,
            "summary": summary,
            "author": author,
            "status": status,
            "image_url": image_url,
            "header_image": header_image,
            "thumbnail": thumbnail,
            "tags": tags or [],
            "read_time": f"{max(1, len(content.split()) // 200)} min read"
        }

        result = client.table("articles").insert(article_data).execute()

        logger.info(f"Article created: {title}")
        return result.data[0] if result.data else {}

    except Exception as e:
        logger.error(f"Error creating article: {str(e)}")
        raise

def update_article(article_id: str, updates: dict) -> dict:
    """Update an existing article"""
    try:
        client = SupabaseClient.get_client()

        # Recalculate read_time if content changed
        if "content" in updates:
            updates["read_time"] = f"{max(1, len(updates['content'].split()) // 200)} min read"

        result = client.table("articles").update(updates).eq("id", article_id).execute()

        logger.info(f"Article updated: {article_id}")
        return result.data[0] if result.data else {}

    except Exception as e:
        logger.error(f"Error updating article: {str(e)}")
        raise

def delete_article(article_id: str) -> bool:
    """Delete an article and its associated images from Storage"""
    try:
        client = SupabaseClient.get_client()

        try:
            storage = SupabaseClient.get_storage()
            bucket_name = "articles"

            for folder in ["header", "thumbnail", "inline", "general"]:
                try:
                    files = storage.from_(bucket_name).list(f"{article_id}/{folder}")
                    for file in files:
                        if file.get("name"):
                            storage.from_(bucket_name).remove([f"{article_id}/{folder}/{file['name']}"])
                except Exception:
                    pass  # Folder might not exist

            logger.info(f"Deleted images for article: {article_id}")
        except Exception as e:
            logger.warning(f"Could not delete article images: {str(e)}")

        client.table("articles").delete().eq("id", article_id).execute()

        logger.info(f"Article deleted: {article_id}")
        return True

    except Exception as e:
        logger.error(f"Error deleting article: {str(e)}")
        return False

def get_article_stats() -> dict:
    """Get article statistics"""
    try:
        client = SupabaseClient.get_client()

        all_articles = client.table("articles").select("status").execute()

        articles = all_articles.data or []
        total = len(articles)
        published = sum(1 for a in articles if a.get("status") == "published")
        draft = sum(1 for a in articles if a.get("status") == "draft")

        return {
            "total": total,
            "published": published,
            "draft": draft
        }

    except Exception as e:
        logger.error(f"Error fetching article stats: {str(e)}")
        return {"total": 0, "published": 0, "draft": 0}


_otp_attempts = defaultdict(list)
MAX_OTP_ATTEMPTS = 5
OTP_WINDOW_SECONDS = 300


def check_otp_rate_limit(email: str) -> bool:
    now = time.time()
    _otp_attempts[email] = [t for t in _otp_attempts[email] if now - t < OTP_WINDOW_SECONDS]
    return len(_otp_attempts[email]) < MAX_OTP_ATTEMPTS


def record_otp_attempt(email: str):
    _otp_attempts[email].append(time.time())


def generate_otp_code(length: int = 6) -> str:
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

def create_otp(email: str, delivery_method: str, phone_number: str = None) -> dict:
    """Create and store an OTP code"""
    try:
        client = SupabaseClient.get_client()

        # Invalidate any existing unused OTPs for this email
        client.table("otp_codes").update({
            "used": True
        }).eq("email", email).eq("used", False).execute()

        code = generate_otp_code()
        code_hash = _hash_otp(code)

        # Set expiry (5 minutes from now)
        from datetime import datetime, timedelta, timezone
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

        result = client.table("otp_codes").insert({
            "email": email,
            "code": code_hash,
            "delivery_method": delivery_method,
            "phone_number": phone_number,
            "expires_at": expires_at,
            "used": False
        }).execute()

        logger.info(f"OTP created for {email} via {delivery_method}")
        return {
            "code": code,
            "email": email,
            "delivery_method": delivery_method,
            "expires_at": expires_at
        }

    except Exception as e:
        logger.error(f"Error creating OTP: {str(e)}")
        raise

def verify_otp(email: str, code: str) -> bool:
    """Verify an OTP code"""
    try:
        client = SupabaseClient.get_client()

        from datetime import datetime, timezone

        code_hash = _hash_otp(code)

        result = client.table("otp_codes").select("*").eq(
            "email", email
        ).eq(
            "code", code_hash
        ).eq(
            "used", False
        ).execute()

        if not result.data:
            logger.warning(f"No matching OTP found for {email}")
            return False

        otp_record = result.data[0]

        # Check expiry
        expires_at = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            logger.warning(f"OTP expired for {email}")
            return False

        # Mark as used
        client.table("otp_codes").update({
            "used": True
        }).eq("id", otp_record["id"]).execute()

        logger.info(f"OTP verified successfully for {email}")
        return True

    except Exception as e:
        logger.error(f"Error verifying OTP: {str(e)}")
        return False

def cleanup_expired_otps():
    """Delete expired OTP codes from database"""
    try:
        client = SupabaseClient.get_client()

        from datetime import datetime, timezone

        result = client.table("otp_codes").delete().lt(
            "expires_at", datetime.now(timezone.utc).isoformat()
        ).execute()

        logger.info("Expired OTPs cleaned up")
        return True

    except Exception as e:
        logger.warning(f"Error cleaning up OTPs: {str(e)}")
        return False


def verify_otp_completed(email: str) -> bool:
    """Check if an OTP was recently verified (used=True) for this email within the last 15 minutes"""
    try:
        client = SupabaseClient.get_client()
        from datetime import datetime, timedelta, timezone

        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()

        result = client.table("otp_codes").select("id").eq(
            "email", email
        ).eq(
            "used", True
        ).gte(
            "created_at", cutoff
        ).limit(1).execute()

        return len(result.data) > 0

    except Exception as e:
        logger.error(f"Error checking OTP completion: {str(e)}")
        return False


def reset_user_password(email: str, new_password: str) -> dict:
    """Reset a user's password using Supabase Admin API (requires service_role key)"""
    try:
        import httpx

        supabase_url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not service_key:
            return {"success": False, "message": "Supabase not configured"}

        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json"
        }

        with httpx.Client() as http:
            response = http.get(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers,
                params={"email": email}
            )

            if response.status_code != 200:
                logger.error(f"Failed to list users: {response.text}")
                return {"success": False, "message": "Failed to find user"}

            users = response.json().get("users", [])
            user = None
            for u in users:
                if u.get("email", "").lower() == email.lower():
                    user = u
                    break

            if not user:
                return {"success": False, "message": "User not found with this email"}

            user_id = user["id"]

            update_response = http.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=headers,
                json={"password": new_password}
            )

            if update_response.status_code == 200:
                logger.info(f"Password reset successfully for {email}")
                return {"success": True, "message": "Password reset successfully"}
            else:
                logger.error(f"Failed to update password: {update_response.text}")
                return {"success": False, "message": "Failed to update password"}

    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return {"success": False, "message": "Internal server error"}


def set_user_role(user_id: str, role: str) -> dict:
    """Set a user's role via Supabase Admin API (updates user_metadata.role)"""
    try:
        import httpx
        import uuid

        supabase_url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not service_key:
            return {"success": False, "message": "Supabase not configured"}

        if role not in ("admin", "user"):
            return {"success": False, "message": "Invalid role. Must be 'admin' or 'user'"}

        try:
            uuid.UUID(user_id)
        except ValueError:
            return {"success": False, "message": "Invalid user ID format"}

        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json"
        }

        with httpx.Client() as http:
            response = http.get(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=headers
            )

            if response.status_code != 200:
                logger.error(f"Failed to get user: {response.text}")
                return {"success": False, "message": "User not found"}

            current_metadata = response.json().get("user_metadata", {})
            current_metadata["role"] = role

            update_response = http.put(
                f"{supabase_url}/auth/v1/admin/users/{user_id}",
                headers=headers,
                json={"user_metadata": current_metadata}
            )

            if update_response.status_code == 200:
                logger.info(f"Role set to '{role}' for user {user_id}")
                return {"success": True, "message": f"Role updated to '{role}'"}
            else:
                logger.error(f"Failed to update role: {update_response.text}")
                return {"success": False, "message": "Failed to update role"}

    except Exception as e:
        logger.error(f"Error setting user role: {str(e)}")
        return {"success": False, "message": "Internal server error"}


def list_users() -> dict:
    """List all users via Supabase Admin API"""
    try:
        import httpx

        supabase_url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not service_key:
            return {"success": False, "message": "Supabase not configured"}

        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json"
        }

        with httpx.Client() as http:
            response = http.get(
                f"{supabase_url}/auth/v1/admin/users",
                headers=headers
            )

            if response.status_code == 200:
                users_data = response.json().get("users", [])
                users = [
                    {
                        "id": u["id"],
                        "email": u.get("email", ""),
                        "full_name": u.get("user_metadata", {}).get("full_name", ""),
                        "role": u.get("user_metadata", {}).get("role", "user"),
                        "created_at": u.get("created_at", ""),
                    }
                    for u in users_data
                ]
                return {"success": True, "users": users}
            else:
                logger.error(f"Failed to list users: {response.text}")
                return {"success": False, "message": "Failed to list users"}

    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return {"success": False, "message": "Internal server error"}


def insert_prediction(user_id: str, ticker: str, current_price: float,
                      predicted_prices: list, trend: str, predicted_change_percent: float,
                      days_ahead: int = 7) -> dict:
    """Save a prediction to prediction_history table"""
    try:
        client = SupabaseClient.get_client()
        ensure_ticker_exists(ticker)

        data = {
            "user_id": user_id,
            "ticker": ticker.upper(),
            "current_price": current_price,
            "predicted_prices": predicted_prices,
            "trend": trend,
            "predicted_change_percent": predicted_change_percent,
            "days_ahead": days_ahead,
            "status": "pending"
        }

        result = client.table("prediction_history").insert(data).execute()
        logger.info(f"Prediction saved for {ticker} by user {user_id}")
        return result.data[0] if result.data else {}

    except Exception as e:
        logger.error(f"Error saving prediction: {str(e)}")
        return {"error": str(e)}


def get_user_predictions(user_id: str, ticker: str = None, status: str = None, limit: int = 50) -> list:
    """Get prediction history for a user"""
    try:
        client = SupabaseClient.get_client()
        query = client.table("prediction_history").select("*").eq("user_id", user_id)

        if ticker:
            query = query.eq("ticker", ticker.upper())
        if status:
            query = query.eq("status", status)

        result = query.order("created_at", desc=True).limit(limit).execute()
        return result.data or []

    except Exception as e:
        logger.error(f"Error fetching predictions: {str(e)}")
        return []


def get_pending_validations(limit: int = 100) -> list:
    """Get predictions that are pending and past their forecast period"""
    try:
        client = SupabaseClient.get_client()
        result = client.table("prediction_history") \
            .select("*") \
            .eq("status", "pending") \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()

        predictions = result.data or []

        # Filter to only those where the last forecast date has passed
        from datetime import datetime, date
        today = date.today().isoformat()
        ready = []
        for pred in predictions:
            pred_dates = pred.get("predicted_prices", [])
            if pred_dates:
                last_date = pred_dates[-1].get("date", "")
                if last_date <= today:
                    ready.append(pred)

        return ready

    except Exception as e:
        logger.error(f"Error fetching pending validations: {str(e)}")
        return []


def update_prediction_validation(pred_id: str, actual_prices: list,
                                  actual_change_percent: float, direction_correct: bool,
                                  mean_absolute_error: float, mean_percent_error: float) -> dict:
    """Update a prediction with validation results"""
    try:
        from datetime import datetime
        client = SupabaseClient.get_client()

        data = {
            "actual_prices": actual_prices,
            "actual_change_percent": actual_change_percent,
            "direction_correct": direction_correct,
            "mean_absolute_error": mean_absolute_error,
            "mean_percent_error": mean_percent_error,
            "status": "validated",
            "validated_at": datetime.now().isoformat()
        }

        result = client.table("prediction_history").update(data).eq("id", pred_id).execute()
        logger.info(f"Prediction {pred_id} validated")
        return result.data[0] if result.data else {}

    except Exception as e:
        logger.error(f"Error validating prediction: {str(e)}")
        return {"error": str(e)}


def upload_model_file(ticker: str, file_path: str, bucket_name: str = "models") -> str:
    """Upload model file to Supabase Storage"""
    try:
        storage = SupabaseClient.get_storage()

        with open(file_path, "rb") as f:
            file_name = os.path.basename(file_path)
            path = f"{ticker}/{file_name}"

            storage.from_(bucket_name).upload(path, f)

            logger.info(f"Model file uploaded: {path}")

            url = storage.from_(bucket_name).get_public_url(path)
            return url

    except Exception as e:
        logger.error(f"Error uploading model file: {str(e)}")
        raise

def upload_article_image(file_content: bytes, file_name: str, article_id: str = None, image_type: str = "general") -> str:
    """Upload article image to Supabase Storage"""
    try:
        storage = SupabaseClient.get_storage()
        bucket_name = "articles"

        import uuid
        ext = os.path.splitext(file_name)[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"

        if article_id:
            path = f"{article_id}/{image_type}/{unique_name}"
        else:
            path = f"temp/{image_type}/{unique_name}"

        content_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml"
        }
        content_type = content_types.get(ext.lower(), "image/jpeg")

        storage.from_(bucket_name).upload(
            path,
            file_content,
            {"content-type": content_type}
        )

        url = storage.from_(bucket_name).get_public_url(path)
        logger.info(f"Article image uploaded: {path}")
        return url

    except Exception as e:
        logger.error(f"Error uploading article image: {str(e)}")
        raise

def download_model_file(ticker: str, file_name: str, bucket_name: str = "models") -> bytes:
    """Download model file from Supabase Storage"""
    try:
        storage = SupabaseClient.get_storage()

        path = f"{ticker}/{file_name}"
        data = storage.from_(bucket_name).download(path)

        logger.info(f"Model file downloaded: {path}")
        return data

    except Exception as e:
        logger.error(f"Error downloading model file: {str(e)}")
        raise
