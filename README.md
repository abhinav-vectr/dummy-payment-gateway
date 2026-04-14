# NovaPay: Dummy Payment Gateway

A high-fidelity simulation of a modern Indian payment gateway (inspired by Razorpay, Stripe, and Linear).

## Features

- **Merchant Dashboard**: Real-time metrics, transaction history, and API key management.
- **Hosted Checkout**: A premium, "hosted" payment experience with support for Card, UPI, and Netbanking.
- **Realistic Lifecycle**: 
  - Simulated payment processing delays (2-5s).
  - Success/Failure probabilities.
  - Webhook delivery with exponential backoff retry logic.
- **Clean Architecture**: 
  - **Backend**: FastAPI, PostgreSQL (SQLAlchemy), Pydantic.
  - **Frontend**: React, Vite, Tailwind CSS, Framer Motion (for sexy animations).

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, PostgreSQL.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons.

## Getting Started

### 1. Backend Setup

```bash
cd backend
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

*Note: By default, it uses the PostgreSQL connection string from `docker-compose.yml`. Ensure Postgres is running or update `core/config.py` to use SQLite for quick testing.*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Testing the Flow

1. **Dashboard**: Navigate to `http://localhost:5173/` to see the Merchant Dashboard.
2. **Developers**: Go to the "Developers" tab to find your test API Keys.
3. **Checkout**: You can manually visit `http://localhost:5173/checkout/pay_dummy123` to test the hosted checkout UI.
4. **Integration**: Use the CURL command provided in the Developers section to create a real payment in the database.

## Design Philosophy

NovaPay uses a "Minimalist-SaaS" design language:
- **Spaciousness**: Generous padding and whitespace.
- **Typography**: Inter font family for clarity.
- **Depth**: Soft shadows and subtle borders instead of heavy gradients.
- **Interactivity**: Micro-animations using Framer Motion for a premium feel.

---
*This is a dummy project for demo purposes. No real transactions are processed.*
