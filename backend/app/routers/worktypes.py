from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import WorkTypeCreate, WorkTypeUpdate, WorkTypeOut
from ..dependencies import get_session, SessionContext
from .. import crud

router = APIRouter()


@router.get("/", response_model=list[WorkTypeOut])
async def list_work_types(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.get_work_types(db)


@router.get("/active", response_model=list[WorkTypeOut])
async def active_work_types(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.get_active_work_types(db)


@router.post("/", response_model=WorkTypeOut)
async def create_work_type(data: WorkTypeCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.create_work_type(db, data.model_dump())


@router.put("/{wt_id}", response_model=WorkTypeOut)
async def update_work_type(wt_id: int, data: WorkTypeUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    wt = await crud.get_work_type_by_id(db, wt_id)
    if not wt:
        raise HTTPException(404, "სამუშაოს ტიპი ვერ მოიძებნა")
    return await crud.update_work_type(db, wt, data.model_dump())


@router.delete("/{wt_id}")
async def delete_work_type(wt_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    wt = await crud.get_work_type_by_id(db, wt_id)
    if not wt:
        raise HTTPException(404, "სამუშაოს ტიპი ვერ მოიძებნა")
    await crud.delete_work_type(db, wt)
    return {"ok": True}
