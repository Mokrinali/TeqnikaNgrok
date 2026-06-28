from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import LogEntryCreate, LogExitUpdate, LogOut, LogUpdate
from ..dependencies import get_session, get_admin_session, SessionContext
from ..crud import (
    get_logs, get_log_by_id, get_open_entry, create_log, update_log, delete_log,
    get_equipment_by_id, get_contractor_by_id, save_photo,
    calc_overtime_hours, calc_total_hours,
)

router = APIRouter()


def _enrich_log(log) -> dict:
    overtime = calc_overtime_hours(log.exit_timestamp) if log.exit_timestamp else 0.0
    total_h = calc_total_hours(log.entry_timestamp, log.exit_timestamp)
    return {
        **{c.name: getattr(log, c.name) for c in log.__table__.columns},
        "is_open": log.exit_timestamp is None,
        "total_hours": round(total_h, 2),
        "overtime_hours": overtime,
    }


@router.get("/", response_model=list[LogOut])
async def list_logs(
    from_dt: datetime | None = None,
    to_dt: datetime | None = None,
    contractor_id: int | None = None,
    site_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    session: SessionContext = Depends(get_session),
):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start = from_dt or today
    end = to_dt or today.replace(hour=23, minute=59, second=59)
    effective_site = site_id if session.is_admin else session.current_site_id
    logs = await get_logs(db, start, end, effective_site, contractor_id)
    return [_enrich_log(l) for l in logs]


@router.get("/open/{equipment_id}")
async def open_entry(equipment_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    log = await get_open_entry(db, equipment_id)
    if not log:
        return None
    return _enrich_log(log)


@router.post("/entry", response_model=LogOut)
async def record_entry(data: LogEntryCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    existing = await get_open_entry(db, data.equipment_id)
    if existing:
        raise HTTPException(400, "ეს ტექნიკა უკვე შემოსულია")

    eq = await get_equipment_by_id(db, data.equipment_id)
    contractor = await get_contractor_by_id(db, data.contractor_id)
    if not eq or not contractor:
        raise HTTPException(404, "ტექნიკა ან კონტრაქტორი ვერ მოიძებნა")

    photo_url = await save_photo(data.photo_base64, "entry", eq.plate_number or eq.name)

    log = await create_log(db, {
        "equipment_id": data.equipment_id,
        "equipment_name": eq.name,
        "plate_number": eq.plate_number,
        "contractor_id": data.contractor_id,
        "contractor_name": contractor.name,
        "daily_rate": float(eq.daily_rate),
        "entry_timestamp": datetime.now(),
        "entry_photo_url": photo_url,
        "verification_code": data.verification_code,
    })
    return _enrich_log(log)


@router.post("/exit", response_model=LogOut)
async def record_exit(data: LogExitUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    log = await get_log_by_id(db, data.log_id)
    if not log or log.exit_timestamp is not None:
        raise HTTPException(404, "ჩანაწერი ვერ მოიძებნა ან უკვე დახურულია")

    photo_url = await save_photo(data.photo_base64, "exit", log.plate_number or log.equipment_name)
    updated = await update_log(db, log, {
        "exit_timestamp": datetime.now(),
        "exit_photo_url": photo_url,
    })
    return _enrich_log(updated)


@router.put("/{log_id}", response_model=LogOut)
async def edit_log(log_id: int, data: LogUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    log = await get_log_by_id(db, log_id)
    if not log:
        raise HTTPException(404, "ჩანაწერი ვერ მოიძებნა")
    updated = await update_log(db, log, data.model_dump())
    return _enrich_log(updated)


@router.delete("/{log_id}")
async def remove_log(log_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    log = await get_log_by_id(db, log_id)
    if not log:
        raise HTTPException(404, "ჩანაწერი ვერ მოიძებნა")
    await delete_log(db, log)
    return {"ok": True}
