import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Optional, Dict, Any, List

from src.enums import ReportType
from bot.models import BotMessage

logger = logging.getLogger(__name__)

class TaskService:
    """
    Task Management Service
    
    Responsibilities:
    1. Manage asynchronous analysis tasks
    2. Execute stock analysis
    """
    
    _instance: Optional['TaskService'] = None
    _lock = threading.Lock()
    
    def __init__(self, max_workers: int = 3):
        self._executor: Optional[ThreadPoolExecutor] = None
        self._max_workers = max_workers
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._tasks_lock = threading.Lock()
    
    @classmethod
    def get_instance(cls) -> 'TaskService':
        """Get singleton instance"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    @property
    def executor(self) -> ThreadPoolExecutor:
        """Get or create thread pool"""
        if self._executor is None:
            self._executor = ThreadPoolExecutor(
                max_workers=self._max_workers,
                thread_name_prefix="realweb_analysis_"
            )
        return self._executor
    
    def submit_analysis(
        self, 
        code: str, 
        report_type: ReportType = ReportType.SIMPLE,
        source_message: Optional[BotMessage] = None,
        enable_notify: bool = False
    ) -> Dict[str, Any]:
        """
        Submit asynchronous analysis task
        """
        task_id = f"{code}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        # Submit to thread pool
        self.executor.submit(self._run_analysis, code, task_id, report_type, source_message, enable_notify)
        
        logger.info(f"[TaskService] Submitted analysis task for {code}, task_id={task_id}")
        
        return {
            "success": True,
            "message": "Analysis task submitted",
            "code": code,
            "task_id": task_id,
            "report_type": report_type.value,
            "status": "pending"
        }
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status"""
        with self._tasks_lock:
            return self._tasks.get(task_id)
    
    def list_tasks(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent tasks"""
        with self._tasks_lock:
            tasks = list(self._tasks.values())
        # Sort by start time descending
        tasks.sort(key=lambda x: x.get('start_time', ''), reverse=True)
        return tasks[:limit]
    
    def _run_analysis(
        self, 
        code: str, 
        task_id: str, 
        report_type: ReportType = ReportType.SIMPLE,
        source_message: Optional[BotMessage] = None,
        enable_notify: bool = False
    ) -> None:
        """
        Execute single stock analysis
        """
        # Init task status
        with self._tasks_lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "code": code,
                "status": "running",
                "start_time": datetime.now().isoformat(),
                "result": None,
                "error": None,
                "report_type": report_type.value
            }
        
        try:
            # Lazy import to avoid circular dependencies
            from src.config import get_config
            from src.core.pipeline import StockAnalysisPipeline
            
            logger.info(f"[TaskService] Starting analysis for: {code}")
            
            # Create pipeline
            config = get_config()
            pipeline = StockAnalysisPipeline(
                config=config,
                max_workers=1,
                source_message=source_message
            )
            
            # Execute analysis (force single stock notify for real-time feedback)
            result = pipeline.process_single_stock(
                code=code,
                skip_analysis=False,
                single_stock_notify=enable_notify, # Use enable_notify parameter
                report_type=report_type,
                task_id=task_id  # Pass task_id to pipeline to ensure consistency
            )
            
            if result:
                result_data = {
                    "code": result.code,
                    "name": result.name,
                    "sentiment_score": result.sentiment_score,
                    "operation_advice": result.operation_advice,
                    "trend_prediction": result.trend_prediction,
                    "analysis_summary": getattr(result, 'analysis_summary', ''), # handle if attribute missing
                    "one_line_summary": getattr(result, 'one_line_summary', ''),
                }
                
                with self._tasks_lock:
                    self._tasks[task_id].update({
                        "status": "completed",
                        "end_time": datetime.now().isoformat(),
                        "result": result_data
                    })
                
                logger.info(f"[TaskService] Analysis completed for {code}")
            else:
                with self._tasks_lock:
                    self._tasks[task_id].update({
                        "status": "failed",
                        "end_time": datetime.now().isoformat(),
                        "error": "Analysis returned empty result"
                    })
                logger.warning(f"[TaskService] Analysis failed for {code}: Empty result")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[TaskService] Analysis exception for {code}: {error_msg}")
            
            with self._tasks_lock:
                self._tasks[task_id].update({
                    "status": "failed",
                    "end_time": datetime.now().isoformat(),
                    "error": error_msg
                })
