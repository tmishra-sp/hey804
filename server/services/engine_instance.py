"""
Shared engine singleton — one instance for all surfaces (chat, SMS, widget).
"""
from server.services.engine import Hey804Engine
from server.config import KB_PATH

_engine = None


def get_engine() -> Hey804Engine:
    global _engine
    if _engine is None:
        _engine = Hey804Engine(KB_PATH)
    return _engine
