from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import SiteCreate, SiteUpdate, SiteOut
from ..dependencies import get_admin_session, SessionContext
from .. import crud

router = APIRouter()


@router.get("/", response_model=list[SiteOut])
async def list_sites(db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    return await crud.get_sites(db)


@router.post("/", response_model=SiteOut)
async def create_site(data: SiteCreate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    if len(data.code) != 4 or not data.code.isdigit():
        raise HTTPException(400, "კოდი უნდა იყოს ზუსტად 4 ციფრი")
    if await crud.site_code_exists(db, data.code):
        raise HTTPException(400, "ამ კოდით ობიექტი უკვე არსებობს")
    return await crud.create_site(db, data.model_dump())


@router.put("/{site_id}", response_model=SiteOut)
async def update_site(site_id: int, data: SiteUpdate, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    site = await crud.get_site_by_id(db, site_id)
    if not site:
        raise HTTPException(404, "ობიექტი ვერ მოიძებნა")
    if len(data.code) != 4 or not data.code.isdigit():
        raise HTTPException(400, "კოდი უნდა იყოს ზუსტად 4 ციფრი")
    if await crud.site_code_exists(db, data.code, exclude_id=site_id):
        raise HTTPException(400, "ამ კოდით ობიექტი უკვე არსებობს")
    return await crud.update_site(db, site, data.model_dump())


@router.delete("/{site_id}")
async def delete_site(site_id: int, db: AsyncSession = Depends(get_db), session: SessionContext = Depends(get_admin_session)):
    site = await crud.get_site_by_id(db, site_id)
    if not site:
        raise HTTPException(404, "ობიექტი ვერ მოიძებნა")
    await crud.delete_site(db, site)
    return {"ok": True}
