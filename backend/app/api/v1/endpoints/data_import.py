
import asyncio
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Path, Query, UploadFile, status
from loguru import logger

from app.api.dependencies import get_db
from app.models.import_schemas import ImportJobResponse, ImportStatus, ImportType, ImportStartRequest
from app.services.import_service import DataImportService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/data", tags=["Data Import"])

@router.post(
    "/import/upload",
    response_model=dict,
    summary="Upload and validate CSV file",
    description="Upload a CSV file for import. Returns job ID for tracking.",
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_csv_file(
    file: UploadFile = File(..., description="CSV file to import"),
    import_type: ImportType = Query(
        ..., description="Type of data: SALES_DATA, MARKET_PRICES, or INVENTORY"
    ),
) -> dict:

    try:
        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are supported",
            )

        content = await file.read()

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty",
            )

        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_PAYLOAD_TOO_LARGE,
                detail="File size exceeds 50MB limit",
            )

        raw_data, parse_errors = await DataImportService.parse_csv(
            content, import_type
        )

        if parse_errors and not raw_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing CSV: {', '.join(parse_errors)}",
            )

        job_id = DataImportService.create_job(import_type, file.filename)
        job = DataImportService.get_job(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create import job",
            )

        job.raw_data = raw_data
        job.stats.total_records = len(raw_data)

        logger.info(
            f"File uploaded: {file.filename}, records: {len(raw_data)}, "
            f"job_id: {job_id}"
        )

        return {
            "job_id": job_id,
            "total_records": len(raw_data),
            "preview": raw_data[:5],
            "status": "READY_FOR_VALIDATION",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )

@router.post(
    "/import/validate",
    response_model=ImportJobResponse,
    summary="Validate uploaded CSV data",
    description="Validate CSV data and return validation results before importing.",
)
async def validate_import(
    job_id: str = Query(..., description="Job ID from upload endpoint"),
) -> ImportJobResponse:

    try:
        job = DataImportService.get_job(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )

        job.status = ImportStatus.VALIDATING
        job.started_at = job.started_at or asyncio.get_event_loop().time()

        if job.import_type == ImportType.SALES_DATA:
            valid_rows, errors = await DataImportService.validate_sales_data(
                job.raw_data
            )
        elif job.import_type == ImportType.MARKET_PRICES:
            valid_rows, errors = await DataImportService.validate_market_price_data(
                job.raw_data
            )
        elif job.import_type == ImportType.INVENTORY:
            valid_rows, errors = await DataImportService.validate_inventory_data(
                job.raw_data
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown import type: {job.import_type}",
            )

        job.valid_data = [row.dict() for row in valid_rows]
        job.stats.valid_records = len(valid_rows)
        job.stats.invalid_records = len(errors)
        job.stats.validation_errors = errors

        logger.info(
            f"Validation complete for {job_id}: "
            f"{len(valid_rows)} valid, {len(errors)} errors"
        )

        return ImportJobResponse(
            job_id=job.job_id,
            status=job.status,
            import_type=job.import_type,
            filename=job.filename,
            progress_percentage=job.progress_percentage,
            stats=job.stats,
            created_at=job.created_at,
            started_at=job.started_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating import: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating data: {str(e)}",
        )

@router.post(
    "/import/start",
    response_model=ImportJobResponse,
    summary="Start the import process",
    description="Begin importing validated data to the database.",
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_import(
    request: ImportStartRequest,
    db: AsyncSession = Depends(get_db),
) -> ImportJobResponse:

    try:
        job = DataImportService.get_job(request.job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {request.job_id} not found",
            )

        if job.status not in [ImportStatus.VALIDATING, ImportStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot start import from status {job.status}",
            )

        job.status = ImportStatus.IMPORTING
        job.progress_percentage = 0

        asyncio.create_task(
            _run_import(
                job,
                db,
                proceed_with_errors=request.proceed_with_errors,
            )
        )

        logger.info(f"Import started for job {request.job_id}")

        return ImportJobResponse(
            job_id=job.job_id,
            status=job.status,
            import_type=job.import_type,
            filename=job.filename,
            progress_percentage=job.progress_percentage,
            stats=job.stats,
            created_at=job.created_at,
            started_at=job.started_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting import: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting import: {str(e)}",
        )

@router.get(
    "/import/status/{job_id}",
    response_model=ImportJobResponse,
    summary="Get import job status",
    description="Get current status and progress of an import job.",
)
async def get_import_status(
    job_id: str = Path(..., description="Job ID to check"),
) -> ImportJobResponse:

    try:
        job = DataImportService.get_job(job_id)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )

        estimated_remaining = None
        if (
            job.status == ImportStatus.IMPORTING
            and job.progress_percentage > 0
            and job.started_at
        ):
            elapsed = (
                asyncio.get_event_loop().time() - job.started_at
            )
            if job.progress_percentage > 0:
                total_estimated = elapsed / (job.progress_percentage / 100)
                estimated_remaining = int(
                    total_estimated - elapsed
                )

        return ImportJobResponse(
            job_id=job.job_id,
            status=job.status,
            import_type=job.import_type,
            filename=job.filename,
            progress_percentage=job.progress_percentage,
            stats=job.stats,
            error_message=job.error_message,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            estimated_time_remaining=estimated_remaining,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting import status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving status: {str(e)}",
        )

@router.get(
    "/import/jobs",
    response_model=List[ImportJobResponse],
    summary="List all import jobs",
    description="Get a list of all import jobs with their status.",
)
async def list_import_jobs(
    status_filter: ImportStatus = Query(None, description="Filter by status"),
) -> List[ImportJobResponse]:

    try:
        jobs = DataImportService.get_all_jobs()

        if status_filter:
            jobs = [j for j in jobs if j.status == status_filter]

        return [
            ImportJobResponse(
                job_id=job.job_id,
                status=job.status,
                import_type=job.import_type,
                filename=job.filename,
                progress_percentage=job.progress_percentage,
                stats=job.stats,
                error_message=job.error_message,
                created_at=job.created_at,
                started_at=job.started_at,
                completed_at=job.completed_at,
            )
            for job in jobs
        ]

    except Exception as e:
        logger.error(f"Error listing import jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving jobs: {str(e)}",
        )

async def _run_import(
    job, db: AsyncSession, proceed_with_errors: bool = False
) -> None:

    try:
        if job.import_type == ImportType.SALES_DATA:
            valid_rows, errors = await DataImportService.validate_sales_data(
                job.raw_data
            )
            if errors and not proceed_with_errors:
                job.mark_partial()
                job.stats.validation_errors = errors
                return

            stats = await DataImportService.import_sales_data(
                job, valid_rows, db
            )
            job.stats = stats
            job.mark_completed()

        logger.info(f"Import completed for job {job.job_id}")

    except Exception as e:
        logger.error(f"Error in background import: {e}")
        job.mark_failed(str(e))
