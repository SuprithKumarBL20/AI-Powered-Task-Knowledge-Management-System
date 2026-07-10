import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

import urllib.parse

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "task_knowledge_db")

# Construct MySQL Database URL
encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeyforauthmanagement123!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Directories
UPLOADS_DIR = Path(__file__).resolve().parent.parent / os.getenv("UPLOADS_DIR", "uploads")
FAISS_INDEX_PATH = Path(__file__).resolve().parent.parent / os.getenv("FAISS_INDEX_PATH", "faiss_index")

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
FAISS_INDEX_PATH.mkdir(parents=True, exist_ok=True)
