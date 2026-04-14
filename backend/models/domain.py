from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    settings = Column(JSON, default=lambda: {
        "simulation_mode": True,
        "collect_upi_delay": 3,
        "notify_success": True,
        "notify_failure": True
    })
    created_at = Column(DateTime, default=datetime.utcnow)

    api_keys = relationship("APIKey", back_populates="merchant", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="merchant")
    webhook_endpoints = relationship("WebhookEndpoint", back_populates="merchant", cascade="all, delete-orphan")

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    public_key = Column(String, unique=True, index=True, nullable=False)
    secret_key = Column(String, unique=True, index=True, nullable=False)
    mode = Column(String, default="test") # test or live
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="api_keys")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True) # Usually prefixed e.g. pay_xxxxx
    merchant_id = Column(String, ForeignKey("merchants.id"))
    amount = Column(Float, nullable=False) # In smallest currency unit (e.g. paise/cents) or normally. We'll use decimal/float
    currency = Column(String, default="INR")
    status = Column(String, default="created") # created, pending, success, failed, cancelled, refunded
    method = Column(String, nullable=True) # card, upi, netbanking
    description = Column(String, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    callback_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="payments")
    attempts = relationship("PaymentAttempt", back_populates="payment")
    refunds = relationship("Refund", back_populates="payment")
    webhooks = relationship("WebhookEvent", back_populates="payment")

class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    payment_id = Column(String, ForeignKey("payments.id"))
    method = Column(String, nullable=False)
    status = Column(String, nullable=False) # success, failed
    error_code = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    payment = relationship("Payment", back_populates="attempts")

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String, primary_key=True, index=True) # rfnd_xxxx
    payment_id = Column(String, ForeignKey("payments.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, processed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payment = relationship("Payment", back_populates="refunds")

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"))
    payment_id = Column(String, ForeignKey("payments.id"))
    event_type = Column(String, nullable=False) # payment.success, payment.failed
    payload = Column(JSON, nullable=False)
    endpoint = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, success, failed
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payment = relationship("Payment", back_populates="webhooks")

class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(String, primary_key=True, index=True, default=lambda: f"wh_{uuid.uuid4().hex[:12]}")
    merchant_id = Column(String, ForeignKey("merchants.id"))
    url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    events = Column(JSON, default=lambda: ["payment.success", "payment.failed"])
    secret = Column(String, default=lambda: f"whsec_{uuid.uuid4().hex[:16]}")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="webhook_endpoints")
