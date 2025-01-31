from app.config import *

def check_config():
    print(f'Ollama enabled: {OLLAMA_ENABLED}')
    print(f'Model priority: {MODEL_FALLBACK_PRIORITY}')
    print(f'API Base: {OLLAMA_API_BASE}')

if __name__ == "__main__":
    check_config()
