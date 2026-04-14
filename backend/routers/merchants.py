from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.domain import Merchant, APIKey, Payment, WebhookEndpoint
from schemas.schemas import MerchantResponse, MerchantSettingsUpdate, WebhookEndpointCreate, WebhookEndpointResponse
import uuid

router = APIRouter(prefix="/v1/merchants", tags=["merchants"])

@router.get("/me", response_model=MerchantResponse)
def get_current_merchant(
    db: Session = Depends(get_db)
):
    # Dummy flow: just return the first merchant. 
    # In a real app, this is protected by a session token or JWT.
    merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="No merchant found")
    return merchant

@router.get("/me/metrics")
def get_merchant_metrics(
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).first()
    payments = db.query(Payment).filter(Payment.merchant_id == merchant.id).all()
    
    total_volume = sum(p.amount for p in payments if p.status in ["success", "refunded"])
    success_count = sum(1 for p in payments if p.status == "success")
    failed_count = sum(1 for p in payments if p.status == "failed")
    
    return {
        "total_volume": round(total_volume, 2),
        "success_count": success_count,
        "failed_count": failed_count,
        "total_transactions": len(payments)
    }

@router.patch("/me/settings", response_model=dict)
def update_settings(
    settings_upd: MerchantSettingsUpdate,
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    current_settings = dict(merchant.settings)
    update_data = settings_upd.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        current_settings[key] = value
        
    merchant.settings = current_settings
    db.commit()
    db.refresh(merchant)
    return merchant.settings

@router.post("/me/keys/rotate")
def rotate_keys(db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Invalidate old keys
    db.query(APIKey).filter(APIKey.merchant_id == merchant.id).delete()
    
    # Create new keys
    new_public = f"pg_test_pub_{uuid.uuid4().hex[:12]}"
    new_secret = f"pg_test_sec_{uuid.uuid4().hex[:16]}"
    
    new_key = APIKey(
        merchant_id=merchant.id,
        public_key=new_public,
        secret_key=new_secret,
        mode="test"
    )
    db.add(new_key)
    db.commit()
    return {"public_key": new_public, "secret_key": new_secret}

@router.get("/me/webhooks", response_model=List[WebhookEndpointResponse])
def list_webhooks(db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    return db.query(WebhookEndpoint).filter(WebhookEndpoint.merchant_id == merchant.id).all()

@router.post("/me/webhooks", response_model=WebhookEndpointResponse)
def create_webhook(
    webhook_in: WebhookEndpointCreate,
    db: Session = Depends(get_db)
):
    merchant = db.query(Merchant).first()
    new_webhook = WebhookEndpoint(
        merchant_id=merchant.id,
        url=webhook_in.url,
        description=webhook_in.description,
        events=webhook_in.events or ["payment.success", "payment.failed"]
    )
    db.add(new_webhook)
    db.commit()
    db.refresh(new_webhook)
    return new_webhook

@router.delete("/me/webhooks/{webhook_id}")
def delete_webhook(webhook_id: str, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).first()
    webhook = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == webhook_id, 
        WebhookEndpoint.merchant_id == merchant.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    db.delete(webhook)
    db.commit()
    return {"status": "success"}
