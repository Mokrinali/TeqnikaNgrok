from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
from .config import settings


class SessionContext:
    def __init__(self, site_id: int | None, site_name: str, is_admin: bool):
        self.site_id = site_id
        self.site_name = site_name
        self.is_admin = is_admin

    @property
    def current_site_id(self) -> int | None:
        return None if self.is_admin else self.site_id


def create_token(site_id: int | None, site_name: str, is_admin: bool) -> str:
    payload = {
        "site_id": site_id,
        "site_name": site_name,
        "is_admin": is_admin,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


async def get_session(authorization: str = Header(default=None), _token: str | None = None) -> SessionContext:
    if _token and not authorization:
        authorization = f"Bearer {_token}"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return SessionContext(
            site_id=payload.get("site_id"),
            site_name=payload.get("site_name", ""),
            is_admin=payload.get("is_admin", False),
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_admin_session(session: SessionContext = Depends(get_session)) -> SessionContext:
    if not session.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return session
