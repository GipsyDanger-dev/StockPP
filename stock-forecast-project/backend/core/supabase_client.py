"""
Supabase Client Configuration
Handles connection to Supabase PostgreSQL and Storage
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file
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
        """Initialize Supabase client with credentials from environment"""
        try:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            
            if not url or not key:
                raise ValueError(
                    "Missing Supabase credentials. "
                    "Set SUPABASE_URL and SUPABASE_KEY in .env file"
                )
            
            client = create_client(url, key)
            logger.info("✅ Supabase client initialized successfully")
            return client
            
        except Exception as e:
            logger.error(f"❌ Error initializing Supabase client: {str(e)}")
            raise
    
    @classmethod
    def get_db(cls):
        """Get database client for table operations"""
        return cls.get_client()
    
    @classmethod
    def get_storage(cls):
        """Get storage client for file operations"""
        return cls.get_client().storage

# ============== Database Operations ==============

def init_database_tables():
    """
    Initialize required database tables (tickers, training_logs)
    Call this once after setting up Supabase
    """
    client = SupabaseClient.get_client()
    
    try:
        # Test connection
        result = client.table("tickers").select("count").execute()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.warning(f"⚠️  Database tables may not exist yet: {str(e)}")
        logger.info("Please run the SQL schema in Supabase dashboard")
        return False

# ============== Helper Functions ==============

def ensure_ticker_exists(symbol: str, name: str = None) -> bool:
    """
    Ensure a ticker exists in the tickers table (upsert if not found)

    Args:
        symbol: Stock ticker symbol (e.g., AAPL)
        name: Optional company name

    Returns:
        True if ticker exists or was created
    """
    try:
        client = SupabaseClient.get_client()

        # Check if ticker already exists
        existing = client.table("tickers").select("symbol").eq("symbol", symbol).execute()
        if existing.data:
            return True

        # Insert new ticker
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
    """
    Insert a training log entry into database

    Args:
        ticker: Stock ticker symbol
        report_name: Name of the training report
        rmse: Root Mean Square Error metric
        mae: Mean Absolute Error metric
        status: Training status (Completed, Processing, Failed)

    Returns:
        Inserted record data
    """
    try:
        client = SupabaseClient.get_client()

        # Ensure ticker exists in tickers table (FK constraint)
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
    """
    Get all active tickers from database
    
    Returns:
        List of ticker records
    """
    try:
        client = SupabaseClient.get_client()
        
        result = client.table("tickers").select("*").eq("is_active", True).execute()
        
        return result.data or []
        
    except Exception as e:
        logger.error(f"❌ Error fetching tickers: {str(e)}")
        return []

def get_training_logs(ticker: Optional[str] = None, limit: int = 100) -> list:
    """
    Get training logs from database
    
    Args:
        ticker: Optional ticker filter
        limit: Maximum number of records to return
    
    Returns:
        List of training log records
    """
    try:
        client = SupabaseClient.get_client()
        
        query = client.table("training_logs").select("*").order("created_at", desc=True).limit(limit)
        
        if ticker:
            query = query.eq("ticker", ticker)
        
        result = query.execute()
        
        return result.data or []
        
    except Exception as e:
        logger.error(f"❌ Error fetching training logs: {str(e)}")
        return []

# ============== Article/Insight Operations ==============

def get_all_articles(status: Optional[str] = None, limit: int = 50) -> list:
    """
    Get articles from database

    Args:
        status: Optional filter by status (draft, published)
        limit: Maximum number of records

    Returns:
        List of article records
    """
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
    """
    Get a single article by ID

    Args:
        article_id: Article UUID

    Returns:
        Article record or None
    """
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
    """
    Create a new article

    Args:
        title: Article title
        content: Article content (markdown or plain text)
        category: Article category
        summary: Short summary
        author: Author name
        status: draft or published
        image_url: Optional cover image URL
        header_image: Optional header/hero image URL
        thumbnail: Optional thumbnail image URL
        tags: Optional list of tags

    Returns:
        Created article record
    """
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
    """
    Update an existing article

    Args:
        article_id: Article UUID
        updates: Dict of fields to update

    Returns:
        Updated article record
    """
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
    """
    Delete an article and its associated images from Storage

    Args:
        article_id: Article UUID

    Returns:
        True if deleted successfully
    """
    try:
        client = SupabaseClient.get_client()

        # Delete associated images from Storage
        try:
            storage = SupabaseClient.get_storage()
            bucket_name = "articles"

            # List and delete all files in the article's folder
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

        # Delete the article record
        client.table("articles").delete().eq("id", article_id).execute()

        logger.info(f"Article deleted: {article_id}")
        return True

    except Exception as e:
        logger.error(f"Error deleting article: {str(e)}")
        return False

def get_article_stats() -> dict:
    """
    Get article statistics

    Returns:
        Dict with total, published, draft counts
    """
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

# ============== OTP Operations ==============

import random
import string

def generate_otp_code(length: int = 6) -> str:
    """Generate a random numeric OTP code"""
    return ''.join(random.choices(string.digits, k=length))

def create_otp(email: str, delivery_method: str, phone_number: str = None) -> dict:
    """
    Create and store an OTP code

    Args:
        email: User's email address
        delivery_method: 'email' or 'whatsapp'
        phone_number: Required if delivery_method is 'whatsapp'

    Returns:
        Dict with OTP details including the code
    """
    try:
        client = SupabaseClient.get_client()

        # Invalidate any existing unused OTPs for this email
        client.table("otp_codes").update({
            "used": True
        }).eq("email", email).eq("used", False).execute()

        # Generate new code
        code = generate_otp_code()

        # Set expiry (5 minutes from now)
        from datetime import datetime, timedelta, timezone
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

        # Insert new OTP
        result = client.table("otp_codes").insert({
            "email": email,
            "code": code,
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
    """
    Verify an OTP code

    Args:
        email: User's email address
        code: The OTP code to verify

    Returns:
        True if code is valid and not expired
    """
    try:
        client = SupabaseClient.get_client()

        from datetime import datetime, timezone

        # Find matching unused OTP
        result = client.table("otp_codes").select("*").eq(
            "email", email
        ).eq(
            "code", code
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

# ============== Storage Operations ==============

def upload_model_file(ticker: str, file_path: str, bucket_name: str = "models") -> str:
    """
    Upload model file to Supabase Storage
    
    Args:
        ticker: Stock ticker symbol
        file_path: Local path to file
        bucket_name: Storage bucket name
    
    Returns:
        Public URL of uploaded file
    """
    try:
        storage = SupabaseClient.get_storage()
        
        with open(file_path, "rb") as f:
            file_name = os.path.basename(file_path)
            path = f"{ticker}/{file_name}"
            
            storage.from_(bucket_name).upload(path, f)
            
            logger.info(f"✅ Model file uploaded: {path}")
            
            # Return public URL
            url = storage.from_(bucket_name).get_public_url(path)
            return url
        
    except Exception as e:
        logger.error(f"❌ Error uploading model file: {str(e)}")
        raise

def upload_article_image(file_content: bytes, file_name: str, article_id: str = None, image_type: str = "general") -> str:
    """
    Upload article image to Supabase Storage

    Args:
        file_content: File content as bytes
        file_name: Original file name
        article_id: Article ID for organizing images
        image_type: Type of image (header, thumbnail, inline)

    Returns:
        Public URL of uploaded image
    """
    try:
        storage = SupabaseClient.get_storage()
        bucket_name = "articles"

        # Generate unique filename
        import uuid
        ext = os.path.splitext(file_name)[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"

        # Organize by article_id if provided
        if article_id:
            path = f"{article_id}/{image_type}/{unique_name}"
        else:
            path = f"temp/{image_type}/{unique_name}"

        # Determine content type
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
        logger.info(f"✅ Article image uploaded: {path}")
        return url

    except Exception as e:
        logger.error(f"❌ Error uploading article image: {str(e)}")
        raise

def download_model_file(ticker: str, file_name: str, bucket_name: str = "models") -> bytes:
    """
    Download model file from Supabase Storage
    
    Args:
        ticker: Stock ticker symbol
        file_name: Name of file to download
        bucket_name: Storage bucket name
    
    Returns:
        File contents as bytes
    """
    try:
        storage = SupabaseClient.get_storage()
        
        path = f"{ticker}/{file_name}"
        data = storage.from_(bucket_name).download(path)
        
        logger.info(f"✅ Model file downloaded: {path}")
        return data
        
    except Exception as e:
        logger.error(f"❌ Error downloading model file: {str(e)}")
        raise
