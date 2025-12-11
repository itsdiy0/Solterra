# Solterra : ROSE Event Management System

A comprehensive event management platform for ROSE Foundation, a Malaysian NGO providing mobile cervical cancer screening services to B40 communities. The system features SMS-first architecture, participant booking management, admin event coordination, and secure test results delivery with OTP verification.


## Getting Started
download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your machine.

start by cloning the github repo 
```bash
git clone https://github.com/itsdiy0/Solterra
```
### Backend Setup
```bash
cd backend

# Run Postgres
docker-compose up -d 

# Initialise virtual enviornment
virtualenv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (PostgreSQL, Twilio, Cloudinary)

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/api/docs`

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`
Access the app on: `http://localhost:3000/events`
>Participant authentication screen: `http://localhost:3000/auth/login`
>Admin authentication screen: `http://localhost:3000/admin/login`

## Features

- Multi-step event booking with eligibility screening
- Time slot selection for events
- SMS notifications (OTP, confirmations, results)
- Admin dashboard with analytics
- Test results upload with Cloudinary
- Secure result viewing with OTP verification
- QR code check-in system
