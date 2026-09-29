from typing import Any, Dict, Optional
from datetime import datetime

def success_response(data: Any = None, message: str = "Operation successful") -> Dict[str, Any]:
    """Uniform API success envelope."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }

def error_response(message: str, error_code: Optional[str] = None) -> Dict[str, Any]:
    """Uniform API error envelope."""
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "timestamp": datetime.utcnow().isoformat()
    }
