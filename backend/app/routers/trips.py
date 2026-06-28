from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import TripCreate, TripUpdate, TripOut
from ..dependencies import get_session, SessionContext
from .. import crud

router = APIRouter()


def _enrich_trip(trip) -> dict:
    d = {c.name: getattr(trip, c.name) for c in trip.__table__.columns}
    d["total"] = float(trip.trip_count) * float(trip.price_per_trip)
    return d


@router.get("/", response_model=list[TripOut])
async def list_trips(
    from_dt: date | None = None,
    to_dt: date | None = None,
    contractor_id: int | None = None,
    site_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    session: SessionContext = Depends(get_session),
):
    today = date.today()
    start = from_dt or today
    end = to_dt or today
    effective_site = site_id if session.is_admin else session.current_site_id
    trips = await crud.get_trip_logs(db, start, end, effective_site, contractor_id)
    return [_enrich_trip(t) for t in trips]


@router.get("/contractors/active", response_model=list)
async def active_trip_contractors(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    from ..schemas import ContractorOut
    contractors = await crud.get_active_trip_contractors(db, session.current_site_id)
    return contractors


@router.post("/", response_model=TripOut)
async def create_trip(data: TripCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    if data.trip_count <= 0:
        raise HTTPException(400, "რეისების რაოდენობა უნდა იყოს 1 ან მეტი")
    contractor = await crud.get_contractor_by_id(db, data.contractor_id)
    work_type = await crud.get_work_type_by_id(db, data.work_type_id)
    if not contractor or not work_type:
        raise HTTPException(404, "კონტრაქტორი ან სამუშაოს ტიპი ვერ მოიძებნა")

    trip_data = data.model_dump()
    trip_data["contractor_name"] = contractor.name
    trip_data["plate_number"] = contractor.plate_number
    trip_data["work_type_name"] = work_type.name

    trip = await crud.create_trip_log(db, trip_data)
    return _enrich_trip(trip)


@router.put("/{trip_id}", response_model=TripOut)
async def update_trip(trip_id: int, data: TripUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    trip = await crud.get_trip_log_by_id(db, trip_id)
    if not trip:
        raise HTTPException(404, "ჩანაწერი ვერ მოიძებნა")

    contractor = await crud.get_contractor_by_id(db, data.contractor_id)
    work_type = await crud.get_work_type_by_id(db, data.work_type_id)
    if not contractor or not work_type:
        raise HTTPException(404, "კონტრაქტორი ან სამუშაოს ტიპი ვერ მოიძებნა")

    trip_data = data.model_dump()
    trip_data["contractor_name"] = contractor.name
    trip_data["plate_number"] = contractor.plate_number
    trip_data["work_type_name"] = work_type.name

    updated = await crud.update_trip_log(db, trip, trip_data)
    return _enrich_trip(updated)


@router.delete("/{trip_id}")
async def delete_trip(trip_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    trip = await crud.get_trip_log_by_id(db, trip_id)
    if not trip:
        raise HTTPException(404, "ჩანაწერი ვერ მოიძებნა")
    await crud.delete_trip_log(db, trip)
    return {"ok": True}
