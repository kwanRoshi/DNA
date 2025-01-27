from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# API Keys
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

# Database Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://mongodb:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'dna_analysis')

if not DEEPSEEK_API_KEY:
    raise ValueError("DEEPSEEK_API_KEY environment variable is not set")

if not CLAUDE_API_KEY:
    raise ValueError("CLAUDE_API_KEY environment variable is not set") 