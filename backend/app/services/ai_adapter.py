import os

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")

def refine_with_ai(text):
    if not CLAUDE_API_KEY:
        return text  # fallback to deterministic

    # Future integration logic goes here
    # For now, just return original text
    return text