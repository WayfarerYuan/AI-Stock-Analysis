import os
import sys
import logging
import threading
import uvicorn
import argparse
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import get_config
from src.scheduler import run_with_schedule
from main import setup_logging, run_full_analysis, start_bot_stream_clients

logger = logging.getLogger(__name__)

def run_scheduler(config, args):
    """Run the scheduler in a separate thread"""
    logger.info("[Launcher] Starting scheduler...")
    
    def scheduled_task():
        # Reload config for each run to pick up changes
        config.refresh_stock_list()
        # Use run_full_analysis from main.py
        run_full_analysis(config, args)
    
    try:
        run_with_schedule(
            task=scheduled_task,
            schedule_time=config.schedule_time,
            run_immediately=False # Don't run immediately on startup to avoid blocking or conflict
        )
    except Exception as e:
        logger.error(f"[Launcher] Scheduler failed: {e}")

def main():
    # Parse args (reuse logic from main.py or simplified)
    parser = argparse.ArgumentParser(description='RealWeb Stock Analysis Launcher')
    parser.add_argument('--host', type=str, default=os.getenv('WEBUI_HOST', '0.0.0.0'))
    parser.add_argument('--port', type=int, default=int(os.getenv('WEBUI_PORT', '8000')))
    parser.add_argument('--debug', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--no-notify', action='store_true')
    parser.add_argument('--workers', type=int, default=None)
    
    args = parser.parse_args()
    
    # Load config and setup logging
    config = get_config()
    setup_logging(debug=args.debug, log_dir=config.log_dir)
    
    logger.info("=" * 60)
    logger.info("RealWeb Stock Analysis Launcher Starting")
    logger.info("=" * 60)
    
    # Start Bot Stream Clients
    start_bot_stream_clients(config)
    
    # Start Scheduler Thread if enabled
    if config.schedule_enabled:
        scheduler_thread = threading.Thread(target=run_scheduler, args=(config, args), daemon=True)
        scheduler_thread.start()
        logger.info("[Launcher] Scheduler thread started")
    else:
        logger.info("[Launcher] Scheduling disabled in config")

    # Start FastAPI Server
    logger.info(f"[Launcher] Starting FastAPI server on {args.host}:{args.port}")
    uvicorn.run(
        "realweb.backend.main:app", 
        host=args.host, 
        port=args.port, 
        log_level="info" if not args.debug else "debug",
        reload=False
    )

if __name__ == "__main__":
    main()
