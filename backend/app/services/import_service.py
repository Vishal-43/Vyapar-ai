
import asyncio
import csv
import io
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from loguru import logger
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Commodity, Market, MarketPrice, Inventory
from app.models.import_schemas import (
    ImportStats,
    ImportStatus,
    ImportType,
    SalesDataRow,
    ValidationErrorDetail,
    MarketPriceRow,
    InventoryRow,
)

class ImportJob:

    def __init__(self, job_id: str, import_type: ImportType, filename: str):

        self.job_id = job_id
        self.import_type = import_type
        self.filename = filename
        self.status = ImportStatus.PENDING
        self.progress_percentage = 0
        self.created_at = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.stats = ImportStats(
            total_records=0,
            valid_records=0,
            invalid_records=0,
            duplicate_records=0,
            inserted_records=0,
            skipped_records=0,
            validation_errors=[],
        )
        self.error_message: Optional[str] = None
        self.raw_data: List[Dict[str, Any]] = []
        self.valid_data: List[Dict[str, Any]] = []

    def update_progress(self, percentage: int) -> None:

        self.progress_percentage = min(100, max(0, percentage))

    def mark_completed(self) -> None:

        self.status = ImportStatus.COMPLETED
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error_message: str) -> None:

        self.status = ImportStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.utcnow()

    def mark_partial(self) -> None:

        self.status = ImportStatus.PARTIAL
        self.completed_at = datetime.utcnow()

class DataImportService:

    _jobs: Dict[str, ImportJob] = {}

    @classmethod
    def create_job(
        cls, import_type: ImportType, filename: str
    ) -> str:

        job_id = f"import_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid4())[:8]}"
        job = ImportJob(job_id, import_type, filename)
        cls._jobs[job_id] = job
        logger.info(f"Created import job {job_id} for file {filename}")
        return job_id

    @classmethod
    def get_job(cls, job_id: str) -> Optional[ImportJob]:

        return cls._jobs.get(job_id)

    @classmethod
    def get_all_jobs(cls) -> List[ImportJob]:

        return list(cls._jobs.values())

    @classmethod
    async def parse_csv(
        cls, file_content: bytes, import_type: ImportType
    ) -> Tuple[List[Dict[str, Any]], List[str]]:

        try:
            content_str = file_content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(content_str))

            if not reader.fieldnames:
                return [], ["CSV file is empty or invalid"]

            data = []
            errors = []

            for row_num, row in enumerate(reader, start=2):
                row = {k: v for k, v in row.items() if k and v}

                if not row:
                    continue

                data.append(row)

            logger.info(f"Parsed {len(data)} rows from CSV")
            return data, errors

        except UnicodeDecodeError:
            return [], ["File must be UTF-8 encoded"]
        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            return [], [str(e)]

    @classmethod
    async def validate_sales_data(
        cls, raw_data: List[Dict[str, Any]]
    ) -> Tuple[List[SalesDataRow], List[ValidationErrorDetail]]:

        valid_rows = []
        errors = []

        for row_num, row in enumerate(raw_data, start=2):
            try:
                validated_row = SalesDataRow(
                    date=row.get("date", "").strip(),
                    market_name=row.get("market_name", "").strip(),
                    commodity_name=row.get("commodity_name", "").strip(),
                    price=row.get("price", 0),
                    quantity=row.get("quantity", 0),
                    unit=row.get("unit", "kg").strip(),
                    grade=row.get("grade", "").strip() or None,
                )
                valid_rows.append(validated_row)

            except ValueError as e:
                errors.append(
                    ValidationErrorDetail(
                        row=row_num,
                        column="unknown",
                        value=str(row),
                        error_message=str(e),
                        suggestion="Check data format and types",
                    )
                )

        logger.info(f"Validated {len(valid_rows)} rows, {len(errors)} errors")
        return valid_rows, errors

    @classmethod
    async def validate_market_price_data(
        cls, raw_data: List[Dict[str, Any]]
    ) -> Tuple[List[MarketPriceRow], List[ValidationErrorDetail]]:

        valid_rows = []
        errors = []

        for row_num, row in enumerate(raw_data, start=2):
            try:
                validated_row = MarketPriceRow(
                    date=row.get("date", "").strip(),
                    market_name=row.get("market_name", "").strip(),
                    commodity_name=row.get("commodity_name", "").strip(),
                    min_price=row.get("min_price", 0),
                    max_price=row.get("max_price", 0),
                    modal_price=row.get("modal_price", 0),
                    arrival_quantity=row.get("arrival_quantity", 0),
                )
                valid_rows.append(validated_row)

            except ValueError as e:
                errors.append(
                    ValidationErrorDetail(
                        row=row_num,
                        column="unknown",
                        value=str(row),
                        error_message=str(e),
                        suggestion="Check data format and types",
                    )
                )

        logger.info(f"Validated {len(valid_rows)} rows, {len(errors)} errors")
        return valid_rows, errors

    @classmethod
    async def validate_inventory_data(
        cls, raw_data: List[Dict[str, Any]]
    ) -> Tuple[List[InventoryRow], List[ValidationErrorDetail]]:

        valid_rows = []
        errors = []

        for row_num, row in enumerate(raw_data, start=2):
            try:
                validated_row = InventoryRow(
                    date=row.get("date", "").strip(),
                    market_name=row.get("market_name", "").strip(),
                    commodity_name=row.get("commodity_name", "").strip(),
                    quantity_in_stock=row.get("quantity_in_stock", 0),
                    quantity_sold=row.get("quantity_sold", 0),
                    quantity_damaged=row.get("quantity_damaged", 0),
                    unit=row.get("unit", "kg").strip(),
                    notes=row.get("notes", "").strip() or None,
                )
                valid_rows.append(validated_row)

            except ValueError as e:
                errors.append(
                    ValidationErrorDetail(
                        row=row_num,
                        column="unknown",
                        value=str(row),
                        error_message=str(e),
                        suggestion="Check data format and types",
                    )
                )

        logger.info(f"Validated {len(valid_rows)} rows, {len(errors)} errors")
        return valid_rows, errors

    @classmethod
    async def import_sales_data(
        cls,
        job: ImportJob,
        valid_rows: List[SalesDataRow],
        db_session: AsyncSession,
        skip_duplicates: bool = True,
    ) -> ImportStats:

        stats = ImportStats(
            total_records=len(valid_rows),
            valid_records=len(valid_rows),
            invalid_records=0,
            duplicate_records=0,
            inserted_records=0,
            skipped_records=0,
            validation_errors=[],
        )

        inserted = 0
        duplicates = 0

        try:
            for idx, row in enumerate(valid_rows):
                try:
                    market_result = await db_session.execute(
                        select(Market).where(Market.name == row.market_name)
                    )
                    market = market_result.scalars().first()

                    if not market:
                        market = Market(
                            name=row.market_name,
                            state="Unknown",
                            district="Unknown",
                            agmarknet_code=None,
                        )
                        db_session.add(market)
                        await db_session.flush()

                    commodity_result = await db_session.execute(
                        select(Commodity).where(Commodity.name == row.commodity_name)
                    )
                    commodity = commodity_result.scalars().first()

                    if not commodity:
                        commodity = Commodity(
                            name=row.commodity_name,
                            category="Other",
                            unit=row.unit,
                        )
                        db_session.add(commodity)
                        await db_session.flush()

                    existing = await db_session.execute(
                        select(SalesHistory).where(
                            and_(
                                SalesHistory.market_id == market.id,
                                SalesHistory.commodity_id == commodity.id,
                                SalesHistory.date == datetime.strptime(
                                    row.date, "%Y-%m-%d"
                                ).date(),
                            )
                        )
                    )

                    if existing.scalars().first():
                        if skip_duplicates:
                            duplicates += 1
                            continue
                        else:
                            record = existing.scalars().first()
                            record.price = row.price
                            record.quantity = row.quantity
                            record.grade = row.grade
                    else:
                        sales_record = SalesHistory(
                            market_id=market.id,
                            commodity_id=commodity.id,
                            date=datetime.strptime(row.date, "%Y-%m-%d").date(),
                            price=row.price,
                            quantity=row.quantity,
                            grade=row.grade,
                        )
                        db_session.add(sales_record)

                    inserted += 1

                    progress = int((idx / len(valid_rows)) * 100)
                    job.update_progress(progress)

                except Exception as e:
                    logger.error(f"Error importing row {idx}: {e}")
                    stats.skipped_records += 1

            await db_session.commit()

            stats.inserted_records = inserted
            stats.duplicate_records = duplicates
            stats.skipped_records = len(valid_rows) - inserted - duplicates

            logger.info(
                f"Import completed: {inserted} inserted, {duplicates} duplicates, "
                f"{stats.skipped_records} skipped"
            )

        except Exception as e:
            await db_session.rollback()
            logger.error(f"Error during import: {e}")
            raise

        return stats
