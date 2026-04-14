from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

from core.database import get_db, SessionLocal
from core.security import verify_secret_key, verify_public_key
from models.domain import Merchant, Payment, PaymentAttempt, Refund
from schemas.schemas import PaymentCreateReq, PaymentResponse, PaymentAttemptReq, RefundReq, RefundResponse
from services.webhook_service import create_webhook_events, trigger_webhook_task

router = APIRouter(prefix="/v1/payments", tags=["payments"])

def generate_payment_id():
    return f"pay_{uuid.uuid4().hex[:12]}"

def generate_refund_id():
    return f"rfnd_{uuid.uuid4().hex[:12]}"

@router.post("", response_model=PaymentResponse)
def create_payment(
    req: PaymentCreateReq,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(verify_secret_key)
):
    payment = Payment(
        id=generate_payment_id(),
        merchant_id=merchant.id,
        amount=req.amount,
        currency=req.currency,
        description=req.description,
        metadata_info=req.metadata_info,
        callback_url=req.callback_url,
        status="created"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(verify_secret_key)
):
    return db.query(Payment).filter(Payment.merchant_id == merchant.id).order_by(Payment.created_at.desc()).all()

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    # Both sets of keys should work, but for simplicity public key is needed by frontend
    merchant: Merchant = Depends(verify_public_key)
):
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.merchant_id == merchant.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/{payment_id}/attempt", response_model=PaymentResponse)
def attempt_payment(
    payment_id: str,
    req: PaymentAttemptReq,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(verify_public_key) # UI will use public key
):
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.merchant_id == merchant.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status in ["success", "refunded"]:
        raise HTTPException(status_code=400, detail="Payment already processed")

    attempt = PaymentAttempt(
        payment_id=payment.id,
        method=req.method,
        status=req.status,
        error_code=req.error_code,
        error_message=req.error_message
    )
    db.add(attempt)

    payment.method = req.method
    if req.status == "success":
        payment.status = "success"
    else:
        payment.status = "failed"
    
    db.commit()
    db.refresh(payment)

    # Trigger Webhooks for all configured endpoints
    event_type = "payment.success" if payment.status == "success" else "payment.failed"
    payload = {
        "event": event_type,
        "payment": {
            "id": payment.id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "method": payment.method,
            "metadata": payment.metadata_info
        }
    }
    
    # Also handle the legacy callback_url as a one-off event if it exists
    # Or better, we just use the new multi-endpoint system.
    # For now, let's just use create_webhook_events which handles all endpoints.
    events = create_webhook_events(db, merchant.id, payment.id, event_type, payload)
    for event in events:
        background_tasks.add_task(trigger_webhook_task, event.id)

    return payment

@router.post("/{payment_id}/refund", response_model=RefundResponse)
def initiate_refund(
    payment_id: str,
    req: RefundReq,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(verify_secret_key)
):
    payment = db.query(Payment).filter(Payment.id == payment_id, Payment.merchant_id == merchant.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != "success":
        raise HTTPException(status_code=400, detail="Cannot refund a non-successful payment")

    refund = Refund(
        id=generate_refund_id(),
        payment_id=payment.id,
        amount=req.amount,
        status="processed"
    )
    db.add(refund)
    payment.status = "refunded"
    db.commit()
    db.refresh(refund)
    return refund
