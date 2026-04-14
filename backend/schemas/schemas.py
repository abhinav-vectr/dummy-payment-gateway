from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
from datetime import datetime

class APIKeyResponse(BaseModel):
    id: str
    public_key: str
    secret_key: str
    mode: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MerchantBase(BaseModel):
    name: str
    email: str

class MerchantSettingsUpdate(BaseModel):
    simulation_mode: Optional[bool] = None
    collect_upi_delay: Optional[int] = None
    notify_success: Optional[bool] = None
    notify_failure: Optional[bool] = None

class WebhookEndpointCreate(BaseModel):
    url: str
    description: Optional[str] = None
    events: Optional[List[str]] = ["payment.success", "payment.failed"]

class WebhookEndpointResponse(BaseModel):
    id: str
    url: str
    description: Optional[str] = None
    events: List[str]
    is_active: bool
    secret: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MerchantResponse(MerchantBase):
    id: str
    settings: dict
    created_at: datetime
    api_keys: List[APIKeyResponse] = []
    webhook_endpoints: List[WebhookEndpointResponse] = []
    model_config = ConfigDict(from_attributes=True)

class PaymentCreateReq(BaseModel):
    amount: float
    currency: str = "INR"
    description: Optional[str] = None
    metadata_info: Optional[dict] = None
    callback_url: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    merchant_id: str
    amount: float
    currency: str
    status: str
    method: Optional[str] = None
    description: Optional[str] = None
    metadata_info: Optional[dict] = None
    callback_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentAttemptReq(BaseModel):
    method: str
    status: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None

class RefundReq(BaseModel):
    amount: float

class RefundResponse(BaseModel):
    id: str
    payment_id: str
    amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WebhookResponse(BaseModel):
    id: str
    event_type: str
    status: str
    retry_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
