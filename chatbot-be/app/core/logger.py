"""
Production-grade logging configuration with file output, rotation, and structured logging
"""
import logging
import sys
import json
from pathlib import Path
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from typing import Optional
from app.core.config import get_settings


class JSONFormatter(logging.Formatter):
    """Custom formatter for JSON structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if hasattr(record, "agent_id"):
            log_data["agent_id"] = record.agent_id

        # Add any custom fields from extra parameter
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName',
                           'levelname', 'levelno', 'lineno', 'module', 'msecs',
                           'message', 'pathname', 'process', 'processName',
                           'relativeCreated', 'thread', 'threadName', 'exc_info',
                           'exc_text', 'stack_info', 'request_id', 'user_id', 'agent_id']:
                try:
                    json.dumps(value)  # Test if value is JSON serializable
                    log_data[key] = value
                except (TypeError, ValueError):
                    log_data[key] = str(value)

        return json.dumps(log_data)


class ConsoleFormatter(logging.Formatter):
    """Custom formatter for console output with colors"""

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        # Add color to level name
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"

        # Format the message
        formatted = super().format(record)

        # Reset levelname to original (for other handlers)
        record.levelname = levelname

        return formatted


def setup_logger(name: str, request_id: Optional[str] = None) -> logging.Logger:
    """
    Configure and return a production-grade logger instance

    Features:
    - Console output with colors
    - File output with rotation
    - JSON structured logging for production
    - Request ID tracking
    - Multiple log levels
    """
    settings = get_settings()

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Prevent propagation to root logger
    logger.propagate = False

    # Create logs directory
    log_dir = Path("./logs")
    log_dir.mkdir(exist_ok=True)

    # 1. Console Handler (with colors)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
    console_formatter = ConsoleFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # 2. File Handler (rotating by size) - for general logs
    file_handler = RotatingFileHandler(
        filename=log_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # 3. Error File Handler (for errors only)
    error_handler = RotatingFileHandler(
        filename=log_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    logger.addHandler(error_handler)

    # 4. JSON Handler (for production log aggregation)
    json_handler = TimedRotatingFileHandler(
        filename=log_dir / "app.json.log",
        when='midnight',
        interval=1,
        backupCount=30,
        encoding='utf-8'
    )
    json_handler.setLevel(logging.INFO)
    json_handler.setFormatter(JSONFormatter())
    logger.addHandler(json_handler)

    return logger


def get_logger(name: str, request_id: Optional[str] = None) -> logging.Logger:
    """
    Get or create a logger instance

    Args:
        name: Logger name (usually __name__)
        request_id: Optional request ID for tracking

    Returns:
        Configured logger instance
    """
    logger = setup_logger(name, request_id)

    # Add request_id to logger if provided
    if request_id:
        logger = logging.LoggerAdapter(logger, {"request_id": request_id})

    return logger


class LoggerMixin:
    """Mixin class to add logging capabilities to services"""

    @property
    def logger(self) -> logging.Logger:
        """Get logger for the class"""
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger

    def log_operation_start(self, operation: str, **kwargs):
        """Log the start of an operation"""
        self.logger.info(
            f"Starting {operation}",
            extra={"operation": operation, "operation_status": "started", **kwargs}
        )

    def log_operation_success(self, operation: str, duration_ms: float = None, **kwargs):
        """Log successful operation"""
        extra = {"operation": operation, "operation_status": "success", **kwargs}
        if duration_ms:
            extra["duration_ms"] = duration_ms
        self.logger.info(f"Completed {operation}", extra=extra)

    def log_operation_error(self, operation: str, error: Exception, **kwargs):
        """Log operation error"""
        self.logger.error(
            f"Failed {operation}: {str(error)}",
            extra={"operation": operation, "operation_status": "failed", "error_type": type(error).__name__, **kwargs},
            exc_info=True
        )
