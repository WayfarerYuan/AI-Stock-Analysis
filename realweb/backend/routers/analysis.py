from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any

from realweb.backend.services.task_service import TaskService
from realweb.backend.services.config_service import ConfigService
from realweb.backend.services.history_service import HistoryService
from src.enums import ReportType

router = APIRouter()

# --- Models ---
class AnalysisRequest(BaseModel):
    code: str
    report_type: str = "simple"
    enable_notify: bool = False

class ConfigUpdateRequest(BaseModel):
    code: str

# --- Dependencies ---
def get_task_service():
    return TaskService.get_instance()

def get_config_service():
    return ConfigService()

def get_history_service():
    return HistoryService()

@router.post("/analyze")
async def analyze_stock(
    req: AnalysisRequest,
    task_service: TaskService = Depends(get_task_service)
):
    try:
        report_enum = ReportType.from_str(req.report_type)
        # Pass enable_notify to submit_analysis
        result = task_service.submit_analysis(req.code, report_enum, enable_notify=req.enable_notify)
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report type")

@router.get("/tasks")
async def list_tasks(
    limit: int = 20,
    task_service: TaskService = Depends(get_task_service)
):
    return task_service.list_tasks(limit)

@router.get("/history")
async def get_history(
    limit: int = 50,
    offset: int = 0,
    history_service: HistoryService = Depends(get_history_service)
):
    # This now returns rich AnalysisRecord data
    return history_service.get_analysis_history(limit, offset)

@router.get("/analysis/{task_id}")
async def get_analysis_detail(
    task_id: str,
    history_service: HistoryService = Depends(get_history_service)
):
    result = history_service.get_analysis_detail(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return result

@router.get("/config/stocks")
async def get_stock_list(
    config_service: ConfigService = Depends(get_config_service)
):
    return {"stocks": config_service.get_stock_list()}

@router.post("/config/stocks")
async def add_stock(
    req: ConfigUpdateRequest,
    config_service: ConfigService = Depends(get_config_service)
):
    new_list = config_service.add_stock_to_list(req.code)
    return {"stocks": new_list}

@router.delete("/config/stocks/{code}")
async def remove_stock(
    code: str,
    config_service: ConfigService = Depends(get_config_service)
):
    new_list = config_service.remove_stock_from_list(code)
    return {"stocks": new_list}
