import httpx
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models.domain import WebhookEvent, WebhookEndpoint
from core.database import SessionLocal

logger = logging.getLogger(__name__)
async def trigger_webhook_task(event_id: str):
    db: Session = SessionLocal()
    try:
        event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
        if not event or event.status == "success":
            return
        
        # Simple delivery logic
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Add a custom-header to mock Stripe/Razorpay style signature
                response = await client.post(
                    event.endpoint, 
                    json=event.payload,
                    headers={"X-NovaPay-Signature": "demo_signature_123"}
                )
            
            if 200 <= response.status_code < 300:
                event.status = "success"
                logger.info(f"Webhook {event_id} delivered successfully")
            else:
                raise Exception(f"HTTP Error: {response.status_code}")
        except Exception as e:
            logger.error(f"Webhook {event_id} delivery failed: {str(e)}")
            event.status = "failed"
            event.retry_count += 1
            if event.retry_count < 5:
                # Exponential backoff
                delay_seconds = 60 * (2 ** event.retry_count)
                event.next_retry_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
            else:
                logger.error(f"Webhook {event_id} retired after 5 attempts")
        
        db.add(event)
        db.commit()
    finally:
        db.close()

def create_webhook_events(db: Session, merchant_id: str, payment_id: str, event_type: str, payload: dict):
    # Find all active endpoints for this merchant that care about this event
    endpoints = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.merchant_id == merchant_id,
        WebhookEndpoint.is_active == True
    ).all()

    created_events = []
    for endpoint in endpoints:
        # Simple check: if events is None/empty or event_type in events
        if not endpoint.events or event_type in endpoint.events:
            event = WebhookEvent(
                merchant_id=merchant_id,
                payment_id=payment_id,
                event_type=event_type,
                payload=payload,
                endpoint=endpoint.url
            )
            db.add(event)
            created_events.append(event)
    
    if created_events:
        db.commit()
        for e in created_events:
            db.refresh(e)
            
    return created_events
