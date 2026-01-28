import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from src.storage import DatabaseManager, StockDaily

logger = logging.getLogger(__name__)

class HistoryService:
    """
    History Data Service
    
    Responsibilities:
    1. Query historical analysis results from database
    """
    
    def __init__(self):
        self.db = DatabaseManager()
    
    def get_history(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get recent analysis history"""
        session = self.db.get_session()
        try:
            stmt = select(StockDaily).order_by(desc(StockDaily.date)).limit(limit).offset(offset)
            results = session.execute(stmt).scalars().all()
            return [r.to_dict() for r in results]
        except Exception as e:
            logger.error(f"Error fetching history: {e}")
            return []
        finally:
            session.close()

    def get_analysis_history(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get rich analysis history from AnalysisRecord"""
        result = self.db.get_analysis_history(limit, offset)
        return {
            "total": result["total"],
            "items": [r.to_dict() for r in result["items"]]
        }

    def get_analysis_detail(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get full details of a specific analysis record"""
        record = self.db.get_analysis_by_id(task_id)
        return record.to_dict() if record else None
