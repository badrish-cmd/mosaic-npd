# Mosaic NPD — AI Product Inventor

**AI-powered New Product Development engine** that analyzes consumer reviews, Reddit discussions, market trends, and competition data to generate ready-to-pitch product concepts.

Built with **FastAPI** (backend) + **React** (frontend) + **PostgreSQL** (database).

---

## Features

- **Complaint Analysis** — Scans reviews & Reddit posts to detect consumer pain points across 10 themes
- **Opportunity Scoring** — Ranks market opportunities by intensity, volume, and estimated market size
- **Concept Generation** — Produces PM-ready product briefs with ingredients, format, pricing, target consumer, and cited evidence
- **Brand Fit Scoring** — Evaluates each concept across gender alignment, price positioning, category fit, and opportunity strength
- **AI Insight Summary** — Dashboard card showing top concept with confidence gauge
- **CSV Upload** — Drag-and-drop upload for 5 data types (reviews, Reddit, trends, competition, cumulative)
- **Column Formatter** — 3-step CSV column mapper to fix mismatched headers before upload
- **Dark UI** — Glassmorphism design with amber accents, animations, and responsive layout

---

## Tech Stack

| Layer    | Technology                                   |
|----------|----------------------------------------------|
| Frontend | React 19, Tailwind CSS 4, React Router DOM 7 |
| Backend  | FastAPI, Uvicorn, SQLAlchemy, Pandas, NumPy   |
| Database | PostgreSQL                                    |
| Deploy   | Vercel (frontend) + Render (backend)          |

---

## Quick Start (Local Development)

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** database (local or cloud like Neon/Supabase)

### 1. Clone the repo

```bash
git clone https://github.com/badrish-cmd/mosiac-npd.git
cd mosiac-npd
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

Start the backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`.

### 4. Load sample data (optional)

Upload the CSV files from the `sample_data/` folder through the Upload page, or run:

```bash
cd backend
python load_data.py
```

---

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app + CORS + startup
    config.py            # Environment config (DATABASE_URL)
    database.py          # SQLAlchemy engine + session
    models.py            # 6 database models
    schemas.py           # Pydantic schemas
    routes/
      analysis.py        # /complaints, /opportunities, /concepts
      upload.py           # CSV upload endpoints (5 types)
      health.py          # Health check
    services/
      review_analyzer.py # 10-theme complaint detection
      scoring.py         # Opportunity scoring + market sizing
      concept_generator.py # PM-ready concept briefs
      brand_fit.py       # 4-axis brand fit scoring
      ai_adapter.py      # Claude/GPT placeholder
  data/                  # Default CSV data files
  requirements.txt

frontend/
  src/
    App.js               # Navigation + routing
    pages/
      dashboard.jsx      # Main intelligence dashboard (4 tabs)
      upload.jsx         # Drag-drop CSV upload
      format.jsx         # Column mapper tool
      login.jsx          # Auth screen
      scraping.jsx       # Coming soon placeholder

sample_data/             # Ready-to-upload CSV files
```

---

## Deployment

See [DEPLOYMENT_GUIDE.txt](DEPLOYMENT_GUIDE.txt) for step-by-step instructions to deploy on:

- **Render** (backend — free tier)
- **Vercel** (frontend — free tier)

**Quick summary:**

1. Push to GitHub
2. Deploy backend on Render → set `DATABASE_URL` env var
3. Deploy frontend on Vercel → set `REACT_APP_API_URL` to your Render URL

---

## API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/`                   | Health check                   |
| GET    | `/health`             | Detailed health status         |
| GET    | `/analysis/complaints`| Complaint analysis (10 themes) |
| GET    | `/analysis/opportunities` | Scored opportunities       |
| GET    | `/analysis/concepts`  | Generated product concepts     |
| POST   | `/upload/reviews`     | Upload reviews CSV             |
| POST   | `/upload/reddit`      | Upload Reddit CSV              |
| POST   | `/upload/trends`      | Upload trends CSV              |
| POST   | `/upload/competition` | Upload competition CSV         |
| POST   | `/upload/cumulative`  | Upload combined CSV            |

---

## Environment Variables

| Variable          | Where      | Description                          |
|-------------------|------------|--------------------------------------|
| `DATABASE_URL`    | Backend    | PostgreSQL connection string         |
| `CLAUDE_API_KEY`  | Backend    | Optional — for future AI integration |
| `REACT_APP_API_URL` | Frontend | Backend URL (e.g. Render URL)       |

---

## License

MIT
