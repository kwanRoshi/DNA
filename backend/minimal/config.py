from typing import List
import os

# Model Configuration
OLLAMA_ENABLED = True
OLLAMA_MODEL = "deepseek-coder:1.5b"
OLLAMA_API_BASE = "http://localhost:11434"
OLLAMA_TIMEOUT_SECONDS = 10

# API Keys
DEEPSEEK_API_KEY = "sk-4ff47d34c52948edab6c9d0e7745b75b"
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")

# Model Priority
MODEL_FALLBACK_PRIORITY: List[str] = ["ollama", "deepseek", "claude"]

# Server Configuration
PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")
