from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

from core.database import Base, engine, SessionLocal
from routers import payments, merchants
from models.domain import Merchant, APIKey
import uuid

app = FastAPI(title="Dummy Payment Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize database
    Base.metadata.create_all(bind=engine)
    
    # Create Dummy Data
    db = SessionLocal()
    try:
        if not db.query(Merchant).first():
            merchant_id = str(uuid.uuid4())
            dummy_merchant = Merchant(
                id=merchant_id,
                name="Demo Merchant",
                email="demo@merchant.com"
            )
            dummy_key = APIKey(
                id=str(uuid.uuid4()),
                merchant_id=merchant_id,
                public_key="pg_test_pub_demo123",
                secret_key="pg_test_sec_demo123",
                mode="test"
            )
            db.add(dummy_merchant)
            db.add(dummy_key)
            db.commit()
    finally:
        db.close()

app.include_router(payments.router)
app.include_router(merchants.router)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Dummy Payment Gateway APIs"}
