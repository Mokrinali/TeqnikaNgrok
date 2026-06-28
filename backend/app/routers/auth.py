from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import AuthRequest, AuthResponse
from ..dependencies import create_token
from ..config import settings
from .. import crud

router = APIRouter()


@router.post("/verify", response_model=AuthResponse)
async def verify_site(req: AuthRequest, db: AsyncSession = Depends(get_db)):
    code = req.code.strip()

    if len(code) != 4 or not code.isdigit():
        raise HTTPException(status_code=400, detail="კოდი უნდა იყოს 4 ციფრი")

    if code == settings.ADMIN_CODE:
        token = create_token(site_id=None, site_name="ადმინი", is_admin=True)
        return AuthResponse(token=token, site_id=None, site_name="ადმინი", is_admin=True)

    site = await crud.find_site_by_code(db, code)
    if not site:
        raise HTTPException(status_code=404, detail="ობიექტი ვერ მოიძებნა")

    token = create_token(site_id=site.id, site_name=site.name, is_admin=False)
    return AuthResponse(token=token, site_id=site.id, site_name=site.name, is_admin=False)
