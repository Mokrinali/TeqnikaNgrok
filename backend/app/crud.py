import math
import base64
import os
from datetime import datetime, date, timezone
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, join
from .models import ConstructionSite, Contractor, Equipment, EquipmentLog, TripLog, WorkType


PHOTOS_DIR = Path("/app/photos")


# ── Overtime calculation ──────────────────────────────────────────────
def calc_overtime_hours(exit_ts: datetime) -> float:
    threshold = exit_ts.replace(hour=18, minute=0, second=0, microsecond=0)
    if exit_ts.tzinfo and not threshold.tzinfo:
        threshold = threshold.replace(tzinfo=exit_ts.tzinfo)
    if exit_ts <= threshold:
        return 0.0
    overtime_h = (exit_ts - threshold).total_seconds() / 3600
    if overtime_h < 0.5:
        return 0.0
    return math.floor(overtime_h * 2) / 2.0


def calc_total_hours(entry_ts: datetime, exit_ts: datetime | None) -> float:
    if not exit_ts:
        return 0.0
    return (exit_ts - entry_ts).total_seconds() / 3600


# ── Photo save ───────────────────────────────────────────────────────
async def save_photo(photo_base64: str | None, folder: str, identifier: str | None) -> str | None:
    if not photo_base64:
        return None
    try:
        data = photo_base64.split(",")[1] if "," in photo_base64 else photo_base64
        img_bytes = base64.b64decode(data)
        safe_id = "".join(c if c.isalnum() or c in "-_" else "_" for c in (identifier or "photo"))[:20]
        filename = f"{datetime.now().strftime('%Y%m%d')}_{safe_id}_{datetime.now().strftime('%H%M%S')}.jpg"
        dir_path = PHOTOS_DIR / folder
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / filename).write_bytes(img_bytes)
        return f"/photos/{folder}/{filename}"
    except Exception:
        return None


# ── Construction Sites ───────────────────────────────────────────────
async def get_sites(db: AsyncSession) -> list[ConstructionSite]:
    result = await db.execute(select(ConstructionSite).order_by(ConstructionSite.code))
    return list(result.scalars().all())

async def get_active_sites(db: AsyncSession) -> list[ConstructionSite]:
    result = await db.execute(
        select(ConstructionSite).where(ConstructionSite.is_active == True).order_by(ConstructionSite.code)
    )
    return list(result.scalars().all())

async def get_site_by_id(db: AsyncSession, site_id: int) -> ConstructionSite | None:
    return await db.get(ConstructionSite, site_id)

async def find_site_by_code(db: AsyncSession, code: str) -> ConstructionSite | None:
    result = await db.execute(
        select(ConstructionSite).where(
            and_(ConstructionSite.code == code, ConstructionSite.is_active == True)
        )
    )
    return result.scalar_one_or_none()

async def site_code_exists(db: AsyncSession, code: str, exclude_id: int = 0) -> bool:
    result = await db.execute(
        select(ConstructionSite.id).where(
            and_(ConstructionSite.code == code, ConstructionSite.id != exclude_id)
        )
    )
    return result.scalar_one_or_none() is not None

async def create_site(db: AsyncSession, data: dict) -> ConstructionSite:
    site = ConstructionSite(**data)
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return site

async def update_site(db: AsyncSession, site: ConstructionSite, data: dict) -> ConstructionSite:
    for k, v in data.items():
        setattr(site, k, v)
    await db.commit()
    await db.refresh(site)
    return site

async def delete_site(db: AsyncSession, site: ConstructionSite) -> None:
    await db.delete(site)
    await db.commit()


# ── Contractors ──────────────────────────────────────────────────────
async def get_contractors(db: AsyncSession, site_id: int | None = None) -> list[Contractor]:
    q = select(Contractor)
    if site_id is not None:
        q = q.where(Contractor.site_id == site_id)
    q = q.order_by(Contractor.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())

async def get_contractor_by_id(db: AsyncSession, cid: int) -> Contractor | None:
    return await db.get(Contractor, cid)

async def find_contractor_by_code(db: AsyncSession, id_code: str) -> Contractor | None:
    result = await db.execute(
        select(Contractor).where(
            and_(Contractor.id_code == id_code, Contractor.is_active == True)
        )
    )
    return result.scalar_one_or_none()

async def contractor_code_exists(db: AsyncSession, id_code: str, exclude_id: int = 0) -> bool:
    result = await db.execute(
        select(Contractor.id).where(
            and_(Contractor.id_code == id_code, Contractor.id != exclude_id)
        )
    )
    return result.scalar_one_or_none() is not None

async def create_contractor(db: AsyncSession, data: dict) -> Contractor:
    c = Contractor(**data)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c

async def update_contractor(db: AsyncSession, c: Contractor, data: dict) -> Contractor:
    for k, v in data.items():
        setattr(c, k, v)
    await db.commit()
    await db.refresh(c)
    return c

async def delete_contractor(db: AsyncSession, c: Contractor) -> None:
    await db.delete(c)
    await db.commit()


# ── Equipment ────────────────────────────────────────────────────────
async def get_equipment(db: AsyncSession, site_id: int | None = None) -> list[Equipment]:
    q = select(Equipment)
    if site_id is not None:
        q = q.join(Contractor, Equipment.contractor_id == Contractor.id).where(Contractor.site_id == site_id)
    q = q.order_by(Equipment.created_at.desc())
    result = await db.execute(q)
    items = list(result.scalars().all())
    for eq in items:
        await db.refresh(eq, ["contractor"])
    return items

async def get_equipment_by_contractor(db: AsyncSession, contractor_id: int) -> list[Equipment]:
    result = await db.execute(
        select(Equipment).where(
            and_(Equipment.contractor_id == contractor_id, Equipment.is_active == True)
        )
    )
    return list(result.scalars().all())

async def get_equipment_by_id(db: AsyncSession, eq_id: int) -> Equipment | None:
    eq = await db.get(Equipment, eq_id)
    if eq:
        await db.refresh(eq, ["contractor"])
    return eq

async def plate_number_exists(db: AsyncSession, plate: str, exclude_id: int = 0) -> bool:
    result = await db.execute(
        select(Equipment.id).where(
            and_(Equipment.plate_number == plate, Equipment.id != exclude_id)
        )
    )
    return result.scalar_one_or_none() is not None

async def create_equipment(db: AsyncSession, data: dict) -> Equipment:
    eq = Equipment(**data)
    db.add(eq)
    await db.commit()
    await db.refresh(eq)
    return eq

async def update_equipment(db: AsyncSession, eq: Equipment, data: dict) -> Equipment:
    for k, v in data.items():
        setattr(eq, k, v)
    await db.commit()
    await db.refresh(eq)
    return eq

async def delete_equipment(db: AsyncSession, eq: Equipment) -> None:
    await db.delete(eq)
    await db.commit()


# ── Equipment Logs ───────────────────────────────────────────────────
async def get_logs(
    db: AsyncSession,
    from_dt: datetime,
    to_dt: datetime,
    site_id: int | None = None,
    contractor_id: int | None = None,
) -> list[EquipmentLog]:
    q = select(EquipmentLog).where(
        and_(EquipmentLog.entry_timestamp >= from_dt, EquipmentLog.entry_timestamp <= to_dt)
    )
    if site_id is not None:
        q = q.join(Contractor, EquipmentLog.contractor_id == Contractor.id).where(Contractor.site_id == site_id)
    if contractor_id is not None:
        q = q.where(EquipmentLog.contractor_id == contractor_id)
    q = q.order_by(EquipmentLog.entry_timestamp.desc())
    result = await db.execute(q)
    return list(result.scalars().all())

async def get_log_by_id(db: AsyncSession, log_id: int) -> EquipmentLog | None:
    return await db.get(EquipmentLog, log_id)

async def get_open_entry(db: AsyncSession, equipment_id: int) -> EquipmentLog | None:
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(EquipmentLog).where(
            and_(
                EquipmentLog.equipment_id == equipment_id,
                EquipmentLog.entry_timestamp >= today_start,
                EquipmentLog.exit_timestamp == None,
            )
        )
    )
    return result.scalar_one_or_none()

async def create_log(db: AsyncSession, data: dict) -> EquipmentLog:
    log = EquipmentLog(**data)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

async def update_log(db: AsyncSession, log: EquipmentLog, data: dict) -> EquipmentLog:
    for k, v in data.items():
        setattr(log, k, v)
    await db.commit()
    await db.refresh(log)
    return log

async def delete_log(db: AsyncSession, log: EquipmentLog) -> None:
    await db.delete(log)
    await db.commit()


# ── Trip Logs ────────────────────────────────────────────────────────
async def get_trip_logs(
    db: AsyncSession,
    from_dt: date,
    to_dt: date,
    site_id: int | None = None,
    contractor_id: int | None = None,
) -> list[TripLog]:
    q = select(TripLog).where(and_(TripLog.date >= from_dt, TripLog.date <= to_dt))
    if site_id is not None:
        q = q.join(Contractor, TripLog.contractor_id == Contractor.id).where(Contractor.site_id == site_id)
    if contractor_id is not None:
        q = q.where(TripLog.contractor_id == contractor_id)
    q = q.order_by(TripLog.date.desc())
    result = await db.execute(q)
    return list(result.scalars().all())

async def get_trip_log_by_id(db: AsyncSession, trip_id: int) -> TripLog | None:
    return await db.get(TripLog, trip_id)

async def get_active_trip_contractors(db: AsyncSession, site_id: int | None = None) -> list[Contractor]:
    q = select(Contractor).where(
        and_(
            Contractor.is_active == True,
            Contractor.contractor_mode.in_(["რეისული", "ორივე"]),
        )
    )
    if site_id is not None:
        q = q.where(Contractor.site_id == site_id)
    q = q.order_by(Contractor.name)
    result = await db.execute(q)
    return list(result.scalars().all())

async def create_trip_log(db: AsyncSession, data: dict) -> TripLog:
    trip = TripLog(**data)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip

async def update_trip_log(db: AsyncSession, trip: TripLog, data: dict) -> TripLog:
    for k, v in data.items():
        setattr(trip, k, v)
    await db.commit()
    await db.refresh(trip)
    return trip

async def delete_trip_log(db: AsyncSession, trip: TripLog) -> None:
    await db.delete(trip)
    await db.commit()


# ── Work Types ───────────────────────────────────────────────────────
async def get_work_types(db: AsyncSession) -> list[WorkType]:
    result = await db.execute(select(WorkType).order_by(WorkType.name))
    return list(result.scalars().all())

async def get_active_work_types(db: AsyncSession) -> list[WorkType]:
    result = await db.execute(
        select(WorkType).where(WorkType.is_active == True).order_by(WorkType.name)
    )
    return list(result.scalars().all())

async def get_work_type_by_id(db: AsyncSession, wt_id: int) -> WorkType | None:
    return await db.get(WorkType, wt_id)

async def create_work_type(db: AsyncSession, data: dict) -> WorkType:
    wt = WorkType(**data)
    db.add(wt)
    await db.commit()
    await db.refresh(wt)
    return wt

async def update_work_type(db: AsyncSession, wt: WorkType, data: dict) -> WorkType:
    for k, v in data.items():
        setattr(wt, k, v)
    await db.commit()
    await db.refresh(wt)
    return wt

async def delete_work_type(db: AsyncSession, wt: WorkType) -> None:
    await db.delete(wt)
    await db.commit()
