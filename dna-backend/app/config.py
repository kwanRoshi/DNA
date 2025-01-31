from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# API Keys with test defaults
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', 'test_key')
CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY', 'test_key')

# Database Configuration
MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'dna_analysis')

# API endpoints
DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"
CLAUDE_API_ENDPOINT = "https://api.anthropic.com/v1/messages"

# Model configurations
DEEPSEEK_MODEL = "deepseek-chat"
CLAUDE_MODEL = "claude-3-opus-20240229"

# Analysis settings
MAX_TOKENS = 2000
TEMPERATURE = 0.3

# Ollama Configuration
OLLAMA_ENABLED = os.getenv('OLLAMA_ENABLED', 'true').lower() == 'true'
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'deepseek-coder:1.5b')
OLLAMA_API_BASE = os.getenv('OLLAMA_API_BASE', 'http://localhost:11434')
OLLAMA_TIMEOUT_SECONDS = int(os.getenv('OLLAMA_TIMEOUT_SECONDS', '10'))

# Model Priority Configuration
MODEL_FALLBACK_PRIORITY = os.getenv('MODEL_FALLBACK_PRIORITY', 'ollama,deepseek,claude').split(',')
