from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserOut
from ..utils.auth import get_current_active_user, get_admin_user
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/", response_model=List[UserOut])
def list_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/{user_id}/make-admin")
def make_admin(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"{user.email} is now an admin"}
