# GENZURA — Setup Guide

## Prerequisites

- Node.js 20+
- MySQL 8.0+
- Python 3.11+
- Docker & Docker Compose (for containerized setup)

---

## Option A: Docker (Recommended)

```bash
# 1. Clone the repo
git clone <repo-url>
cd genzura

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npx prisma migrate dev --name init

# 5. Seed the database
docker-compose exec backend node prisma/seed.js

# 6. Open the app
# Frontend: http://localhost
# API:      http://localhost:5000
# API Docs: http://localhost:5000/api/docs
# AI:       http://localhost:8000
```

---

## Option B: Manual Setup

### 1. Database

```sql
CREATE DATABASE genzura_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, etc.

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api

npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. AI Service

```bash
cd ai-service
cp .env.example .env
# Set DATABASE_URL

python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## Default Login Credentials

| Role          | Email                    | Password     |
|---------------|--------------------------|--------------|
| Admin         | admin@genzura.com        | Admin@123    |
| Stock Manager | manager@genzura.com      | Manager@123  |
| Staff         | staff@genzura.com        | Staff@123    |

---

## WhatsApp Setup (Meta Cloud API)

1. Create a Meta Developer account at https://developers.facebook.com
2. Create a WhatsApp Business app
3. Get your Phone Number ID and Access Token
4. Add to backend `.env`:
   ```
   WHATSAPP_PHONE_NUMBER_ID=your_id
   WHATSAPP_ACCESS_TOKEN=your_token
   ```

## WhatsApp Setup (Twilio — Alternative)

1. Create a Twilio account at https://twilio.com
2. Enable WhatsApp Sandbox
3. Add to backend `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL to your Railway/Render backend URL
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set all environment variables in Railway dashboard
# Railway auto-detects Node.js and runs npm start
```

### AI Service → Docker on any VPS
```bash
docker build -t genzura-ai ./ai-service
docker run -p 8000:8000 --env-file .env genzura-ai
```

---

## Folder Structure

```
genzura/
├── frontend/                  # React + Vite PWA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Sidebar, Header, Layout
│   │   │   └── ui/            # StatCard, DataTable, Modal...
│   │   ├── hooks/             # TanStack Query hooks
│   │   ├── i18n/              # Translations (en, rw, sw, fr)
│   │   ├── lib/               # Axios instance
│   │   ├── pages/             # All page components
│   │   └── store/             # Zustand state (auth, ui)
│   └── public/
│
├── backend/                   # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma      # Full DB schema
│   │   └── seed.js            # Seed data
│   └── src/
│       ├── config/            # Prisma, Swagger
│       ├── middleware/        # Auth, validate, audit, errors
│       ├── modules/           # Feature modules
│       │   ├── auth/
│       │   ├── users/
│       │   ├── stores/
│       │   ├── categories/
│       │   ├── products/
│       │   ├── inventory/     # Transaction engine
│       │   ├── reports/
│       │   ├── notifications/
│       │   └── ai/
│       ├── services/
│       │   └── notification.service.js  # WhatsApp
│       └── utils/             # Logger, apiResponse
│
├── ai-service/                # Python FastAPI
│   ├── app/
│   │   ├── routers/
│   │   │   ├── recommendations.py  # Restock engine
│   │   │   ├── predictions.py      # Demand prediction
│   │   │   └── insights.py         # Health insights
│   │   ├── config.py
│   │   └── database.py
│   └── main.py
│
├── docs/
│   ├── API_ENDPOINTS.md
│   └── SETUP.md
│
├── docker-compose.yml
└── README.md
```
