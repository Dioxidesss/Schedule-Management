# Isomer Backend

FastAPI backend for the Isomer warehouse dock scheduling SaaS.

## Tech Stack
- **FastAPI** + Uvicorn
- **Supabase** (Auth + Postgres + Realtime)
- **Python 3.12+**

## Setup

### 1. Install dependencies
```bash
cd Backend
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
```

### 2. Configure environment
```bash
copy .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
```

> Find your keys in **Supabase Dashboard → Project Settings → API**.
> Find your JWT Secret in **Project Settings → API → JWT Settings**.

### 3. Run locally
```bash
python run.py
# OR
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

## Project Structure
```
Backend/
├── app/
│   ├── core/
│   │   ├── config.py       # Env settings (Pydantic BaseSettings)
│   │   ├── errors.py       # ErrorCode enum + APIError exception
│   │   └── supabase.py     # anon_client + service_client singletons
│   ├── middleware/
│   │   ├── auth.py         # JWT verification + CurrentUser dependency
│   │   └── tenancy.py      # Role + facility scope guards
│   ├── routers/
│   │   ├── auth.py         # POST /auth/signup|login|oauth/google|logout
│   │   └── profile.py      # GET/PATCH /me, POST /me/password
│   └── main.py             # FastAPI app + CORS + exception handlers
├── requirements.txt
├── run.py
└── .env.example
```

## Phase Build Order
- **Phase 1** ✅ Auth + profile (this file)
- Phase 2: Facility ops read model (dashboard, appointments list, devices)
- Phase 3: Appointments CRUD
- Phase 4: Kiosk pairing & device auth
- Phase 5–12: (see Planning/build_sequence.md)
