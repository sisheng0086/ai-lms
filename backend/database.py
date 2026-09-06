import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load .env file when running locally
load_dotenv()

def get_connection():
    """
    Establish a connection to the PostgreSQL database.
    Uses RealDictCursor so rows are returned as dictionaries instead of tuples.
    Credentials are loaded from environment variables (.env locally, Railway env vars in production).
    """
    try:
        # Railway provides a full DATABASE_URL — use it if available
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        else:
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", 5432)),
                dbname=os.getenv("DB_NAME", "AI_lms_db"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
                cursor_factory=RealDictCursor
            )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None
