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
        
        result = client.table("training_logs").insert({
            "ticker": ticker,
            "report_name": report_name,
            "rmse": rmse,
            "mae": mae,
            "status": status
        }).execute()
        
        logger.info(f"✅ Training log inserted for {ticker}")
        return result.data[0] if result.data else {}
        
    except Exception as e:
        logger.error(f"❌ Error inserting training log: {str(e)}")
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
