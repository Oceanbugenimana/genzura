# GENZURA - Inventory & Stock Management Platform

A production-ready, multi-platform inventory management system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        GENZURA PLATFORM                      │
├─────────────────┬───────────────────┬───────────────────────┤
│  React Web App  │ React Native App  │   PWA (Offline)       │
│   (Vite + TW)   │  (Future-ready)   │   Service Worker      │
└────────┬────────┴─────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │    Node.js Express API      │
              │  JWT Auth | Prisma ORM      │
              │  Rate Limiting | Logging    │
              └──────┬──────────┬───────────┘
                     │          │
          ┌──────────▼──┐  ┌────▼──────────────┐
          │   MySQL DB   │  │ Python FastAPI AI  │
          │  (Prisma)    │  │  Restock | Demand  │
          └─────────────┘  └────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  WhatsApp Cloud API  │
          │  Low Stock Alerts    │
          └─────────────────────┘
```

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React.js (Vite), TailwindCSS, Zustand, i18next |
| Backend     | Node.js, Express.js, Prisma ORM, JWT           |
| Database    | MySQL                                           |
| AI Service  | Python FastAPI                                  |
| Notify      | WhatsApp Cloud API / Twilio                    |
| Deploy      | Vercel (FE), Railway (BE), Docker (AI)         |

## Quick Start

```bash
# Clone and setup
git clone <repo>

# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload
```

## Roles
- **Admin** — Full access
- **Stock Manager** — Manage inventory, products, reports
- **Staff** — View and perform stock transactions

## Languages
- English (en)
- Kinyarwanda (rw)
- Kiswahili (sw)
- Français (fr)
