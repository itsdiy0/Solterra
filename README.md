# Solterra : ROSE Event Management System

A comprehensive event management platform for ROSE Foundation, a Malaysian NGO providing mobile cervical cancer screening services to B40 communities. The system features SMS-first architecture, participant booking management, admin event coordination, and secure test results delivery with OTP verification.

## Features

- Multi-step event booking with eligibility screening
- Time slot selection for events
- SMS notifications (OTP, confirmations, results)
- Admin dashboard with analytics
- Test results upload with Cloudinary
- Secure result viewing with OTP verification
- QR code check-in system

## Requirements
- Docker Desktop
- Python 3.11/3.12 (for best compatibility, Python 3.13 has backward compability issues)

## Getting Started
download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your machine.   

start by cloning the github repo 
```bash
git clone https://github.com/itsdiy0/Solterra && cd Solterra
```
> Docker app must be running in the background in order to execute this command.   

Running postgres as DB using docker compose
```bash
docker-compose up -d 
```

### Backend Setup
```bash
cd backend

# Initialise virtual enviornment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) generate seed data for testing purposes
python3 -m seed.seed_data

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (PostgreSQL, Twilio, Cloudinary)

# Run database migrations
alembic upgrade head

# Populate sample seed data
python3 seed_data.py

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
# Add: NEXT_PUBLIC_API_URL=http://localhost:8000, and Google Maps API credentials

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`
>Access the app on: `http://localhost:3000/events`   
>Participant authentication screen: `http://localhost:3000/auth/login`   
>Admin authentication screen: `http://localhost:3000/admin/login`

### Test Logins
Admin 1: `sarah.tan@rosefoundation.my` | `TestPass123!`  
Admin 2: `nurul.aisyah@rosefoundation.my` | `TestPass123!`

## Enviornment Variables 
Don't forget to include your google map API key in frontend .env file : 
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
```
and your Twilio and Cloudinary credintials : 
```bash
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```
SMS mode is mock by default, however you can change it to live to use Twilio as your SMS service :
```bash
SMS_MODE=mock #live
```
> SMS using "mock" will be sent to the console for backend.

