from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import ContractorCreate, ContractorUpdate, ContractorOut
from ..dependencies import get_session, SessionContext
from .. import crud

router = APIRouter()


@router.get("/", response_model=list[ContractorOut])
async def list_contractors(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    return await crud.get_contractors(db, session.current_site_id)


@router.get("/by-code/{id_code}", response_model=ContractorOut)
async def get_by_code(id_code: str, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    c = await crud.find_contractor_by_code(db, id_code)
    if not c:
        raise HTTPException(404, "კონტრაქტორი ვერ მოიძებნა")
    if session.current_site_id is not None and c.site_id != session.current_site_id:
        raise HTTPException(403, "კონტრაქტორი ამ ობიექტს არ ეკუთვნის")
    return c


@router.get("/{contractor_id}", response_model=ContractorOut)
async def get_contractor(contractor_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    c = await crud.get_contractor_by_id(db, contractor_id)
    if not c:
        raise HTTPException(404, "კონტრაქტორი ვერ მოიძებნა")
    return c


@router.post("/", response_model=ContractorOut)
async def create_contractor(data: ContractorCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    if not session.is_admin:
        data = data.model_copy(update={"site_id": session.site_id})
    if not data.id_code.isdigit():
        raise HTTPException(400, "კოდი უნდა შეიცავდეს მხოლოდ ციფრებს")
    expected_len = 9 if data.contractor_type == "შპს" else 11
    if len(data.id_code) != expected_len:
        raise HTTPException(400, f"{data.contractor_type}-სთვის კოდი უნდა იყოს {expected_len} ციფრი")
    if await crud.contractor_code_exists(db, data.id_code):
        raise HTTPException(400, "ამ კოდით კონტრაქტორი უკვე არსებობს")
    return await crud.create_contractor(db, data.model_dump())


@router.put("/{contractor_id}", response_model=ContractorOut)
async def update_contractor(contractor_id: int, data: ContractorUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    c = await crud.get_contractor_by_id(db, contractor_id)
    if not c:
        raise HTTPException(404, "კონტრაქტორი ვერ მოიძებნა")
    if not session.is_admin:
        data = data.model_copy(update={"site_id": session.site_id})
    if not data.id_code.isdigit():
        raise HTTPException(400, "კოდი უნდა შეიცავდეს მხოლოდ ციფრებს")
    expected_len = 9 if data.contractor_type == "შპს" else 11
    if len(data.id_code) != expected_len:
        raise HTTPException(400, f"{data.contractor_type}-სთვის კოდი უნდა იყოს {expected_len} ციფრი")
    if await crud.contractor_code_exists(db, data.id_code, exclude_id=contractor_id):
        raise HTTPException(400, "ამ კოდით კონტრაქტორი უკვე არსებობს")
    return await crud.update_contractor(db, c, data.model_dump())


@router.delete("/{contractor_id}")
async def delete_contractor(contractor_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_session)):
    c = await crud.get_contractor_by_id(db, contractor_id)
    if not c:
        raise HTTPException(404, "კონტრაქტორი ვერ მოიძებნა")
    await crud.delete_contractor(db, c)
    return {"ok": True}
