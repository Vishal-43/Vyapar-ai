from fastapi import APIRouter, HTTPException
from loguru import logger

from app.services.scheduler import get_scheduler

router = APIRouter()

@router.get("/status")
async def get_scheduler_status():
    
    try:
        scheduler = get_scheduler()
        
        jobs = scheduler.get_job_status()
        
        return {
            "status": "running" if scheduler.is_running else "stopped",
            "scheduled_jobs": jobs,
            "message": f"{len(jobs)} automated tasks are active"
        }
    except Exception as e:
        logger.error(f"Unable to retrieve scheduler status: {str(e)}")
        raise HTTPException(status_code=500, detail="Scheduler status unavailable")

@router.post("/trigger/scrape")
async def trigger_manual_scrape():
    
    try:
        scheduler = get_scheduler()
        await scheduler.daily_data_collection()
        
        return {
            "status": "success",
            "message": "Data collection initiated successfully"
        }
    except Exception as e:
        logger.error(f"Manual scrape trigger failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger/retrain")
async def trigger_manual_retrain():
    
    try:
        scheduler = get_scheduler()
        await scheduler.weekly_model_retraining()
        
        return {
            "status": "success",
            "message": "Model retraining initiated successfully"
        }
    except Exception as e:
        logger.error(f"Manual retrain trigger failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
