from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.admin_schemas import AdminRegisterRequest, AdminLoginRequest, TokenResponse, AdminResponse
from app.models.admin import Admin
from app.utils.security import hash_password, verify_password, create_access_token
from app.database import get_db

router = APIRouter(prefix="/admin/auth", tags=["Admin Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_admin(request: AdminRegisterRequest, db: Session = Depends(get_db)):
    existing_admin = db.query(Admin).filter(Admin.email == request.email).first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(request.password)
    new_admin = Admin(name=request.name, email=request.email, password_hash=hashed_pw)
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token({"sub": str(new_admin.id), "role": "admin"})
    return TokenResponse(access_token=access_token, user={"id": str(new_admin.id), "name": new_admin.name, "email": new_admin.email})


@router.post("/login", response_model=TokenResponse)
def login_admin(request: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    if not admin or not verify_password(request.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"sub": str(admin.id), "role": "admin"})
    return TokenResponse(access_token=access_token, user={"id": str(admin.id), "name": admin.name, "email": admin.email})
