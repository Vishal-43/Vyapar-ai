
import logging
import sys
from pathlib import Path
from typing import Any

from loguru import logger

from app.config import settings

class InterceptHandler(logging.Handler):

    def emit(self, record: logging.LogRecord) -> None:

        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )

def serialize_record(record: dict[str, Any]) -> str:

    import json
    from datetime import datetime

    subset = {
        "timestamp": record["time"].strftime("%Y-%m-%d %H:%M:%S.%f"),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
    }

    if record.get("exception"):
        subset["exception"] = record["exception"]

    if record.get("extra"):
        subset["extra"] = record["extra"]

    return json.dumps(subset)

def format_record(record: dict[str, Any]) -> str:

    if settings.log_format == "json":
        return serialize_record(record) + "\n"
    else:
        format_string = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>\n"
        )
        if record.get("exception"):
            format_string += "{exception}\n"
        return format_string

def setup_logging() -> None:

    logger.remove()

    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logger.add(
        sys.stdout,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        level=settings.log_level,
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    if settings.log_format == "json":
        logger.add(
            settings.log_file,
            format="{message}",
            level=settings.log_level,
            rotation=settings.log_rotation,
            retention=settings.log_retention,
            compression=settings.log_compression,
            backtrace=True,
            diagnose=True,
            enqueue=True,
            serialize=True,
        )
    else:
        logger.add(
            settings.log_file,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                "<level>{message}</level>\n"
            ),
            level=settings.log_level,
            rotation=settings.log_rotation,
            retention=settings.log_retention,
            compression=settings.log_compression,
            backtrace=True,
            diagnose=True,
            enqueue=True,
        )

    error_log_path = log_path.parent / "error.log"
    if settings.log_format == "json":
        logger.add(
            str(error_log_path),
            format="{message}",
            level="ERROR",
            rotation=settings.log_rotation,
            retention=settings.log_retention,
            compression=settings.log_compression,
            backtrace=True,
            diagnose=True,
            enqueue=True,
            serialize=True,
        )
    else:
        logger.add(
            str(error_log_path),
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                "<level>{message}</level>\n"
            ),
            level="ERROR",
            rotation=settings.log_rotation,
            retention=settings.log_retention,
            compression=settings.log_compression,
            backtrace=True,
            diagnose=True,
            enqueue=True,
        )

    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    for logger_name in [
        "uvicorn",
        "uvicorn.access",
        "uvicorn.error",
        "fastapi",
        "sqlalchemy.engine",
    ]:
        logging.getLogger(logger_name).handlers = [InterceptHandler()]

    logger.info(f"Logging configured: level={settings.log_level}, format={settings.log_format}")

def get_logger(name: str) -> Any:

    return logger.bind(logger_name=name)

setup_logging()
