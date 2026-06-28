from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import EquipmentCreate, EquipmentUpdate, EquipmentOut
from ..dependencies import get_session, SessionContext
from .. import crud

router = APIRouter()


@router.get("/", response_model=list[EquipmentOut])
async def list_equipment(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.get_equipment(db, session.current_site_id)


@router.get("/by-contractor/{contractor_id}", response_model=list[EquipmentOut])
async def equipment_by_contractor(contractor_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.get_equipment_by_contractor(db, contractor_id)


@router.get("/{equipment_id}", response_model=EquipmentOut)
async def get_equipment(equipment_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    eq = await crud.get_equipment_by_id(db, equipment_id)
    if not eq:
        raise HTTPException(404, "ტექნიკა ვერ მოიძებნა")
    return eq


@router.post("/", response_model=EquipmentOut)
async def create_equipment(data: EquipmentCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    if not data.name.strip():
        raise HTTPException(400, "სახელი სავალდებულოა")
    if data.plate_number and await crud.plate_number_exists(db, data.plate_number):
        raise HTTPException(400, "ამ სახელმწიფო ნომრით ტექნიკა უკვე არსებობს")
    return await crud.create_equipment(db, data.model_dump())


@router.put("/{equipment_id}", response_model=EquipmentOut)
async def update_equipment(equipment_id: int, data: EquipmentUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    eq = await crud.get_equipment_by_id(db, equipment_id)
    if not eq:
        raise HTTPException(404, "ტექნიკა ვერ მოიძებნა")
    if not data.name.strip():
        raise HTTPException(400, "სახელი სავალდებულოა")
    if data.plate_number and await crud.plate_number_exists(db, data.plate_number, exclude_id=equipment_id):
        raise HTTPException(400, "ამ სახელმწიფო ნომრით ტექნიკა უკვე არსებობს")
    return await crud.update_equipment(db, eq, data.model_dump())


@router.delete("/{equipment_id}")
async def delete_equipment(equipment_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    eq = await crud.get_equipment_by_id(db, equipment_id)
    if not eq:
        raise HTTPException(404, "ტექნიკა ვერ მოიძებნა")
    await crud.delete_equipment(db, eq)
    return {"ok": True}
