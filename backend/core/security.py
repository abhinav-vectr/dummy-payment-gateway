from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from core.database import get_db
from models.domain import APIKey, Merchant

public_key_header = APIKeyHeader(name="X-Public-Key", auto_error=False)
secret_key_header = APIKeyHeader(name="X-Secret-Key", auto_error=False)

def verify_public_key(public_key: str = Security(public_key_header), db: Session = Depends(get_db)):
    if not public_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Public Key")
    api_key_obj = db.query(APIKey).filter(APIKey.public_key == public_key).first()
    if not api_key_obj:
        print(f"Auth Failed: Invalid Public Key {public_key}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Public Key")
    return api_key_obj.merchant

def verify_secret_key(secret_key: str = Security(secret_key_header), db: Session = Depends(get_db)):
    if not secret_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Secret Key")
    api_key_obj = db.query(APIKey).filter(APIKey.secret_key == secret_key).first()
    if not api_key_obj:
        print(f"Auth Failed: Invalid Secret Key {secret_key}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Secret Key")
    return api_key_obj.merchant
