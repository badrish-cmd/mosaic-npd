# Mosaic NPD — AI Product Inventor

**AI-powered New Product Development engine** that finds genuine unmet consumer needs backed by live data — not just keyword mining. Scrapes real consumer conversations from Reddit, Google Trends, Amazon, and Flipkart, then generates PM-ready product concept briefs with cited evidence.

Built with **FastAPI** (backend) + **React** (frontend) + **PostgreSQL** (database).

---

## Write-Up (D2C Insight & Design Rationale)

**The D2C insight:** Product ideas are cheap — the real value is proving an unmet need exists with hard evidence. D2C brands launch dozens of products yearly, but most fail because they're based on gut feel, not consumer signal. We built Mosaic NPD to answer: *"What are consumers actually struggling with, hacking together solutions for, and where do existing products genuinely fall short?"*

**What we learned:** Consumer complaints cluster into surprisingly specific themes when you mine real n-gram phrases instead of using hardcoded keyword lists. A complaint about "greasy texture" appearing in 40% of negative reviews, combined with "non-greasy serum" trending at +95% on Google and active Reddit discussions about lightweight alternatives, creates an opportunity signal no individual data source could reveal. The compound signal — complaint intensity × search demand × community validation ÷ competitive density — is what separates genuine opportunities from noise.

**Design choices that matter:**

1. **Live scraping, not sample data.** The system scrapes Reddit's public JSON API, Google Trends via pytrends, and Amazon/Flipkart product pages in real-time. Every data point is sourced fresh — no pre-loaded CSVs required.

2. **Data-driven NLP, not hardcoded keywords.** The complaint extraction engine uses n-gram phrase mining from actual review text, then groups overlapping phrases into complaint themes. This means it works for *any* product category — haircare, skincare, supplements, electronics — without configuration.

3. **Cited evidence chain.** Every product concept links back to specific review quotes, Reddit posts, and trend data points. A product manager can trace any recommendation to its source data within seconds.

4. **Opportunity scoring formula:** `demand_index = (complaint_score + trend_growth + reddit_strength) / 3`, then `gap_score = demand_index - (supply_pressure × 0.3)`, with a confidence multiplier for high-conviction signals. This ensures we only surface opportunities where demand outstrips supply.

5. **PM-ready output.** Each concept is a 7-section brief covering market insight, target consumer, product concept, competitive analysis, cited evidence, and a "why this will work" rationale — immediately actionable, not a list of keywords.

---

## Features

- **Live Data Scraping** — Scrapes Reddit, Google Trends, Amazon India, and Flipkart for real consumer data in real-time
- **Complaint Analysis** — Data-driven NLP extracts consumer pain points from actual review text (no hardcoded keywords)
- **Opportunity Scoring** — Ranks market gaps by complaint intensity + trend growth + Reddit signals − competitive density
- **Concept Generation** — Produces PM-ready product briefs with format, ingredients, pricing, positioning, and cited evidence
- **Brand Fit Scoring** — Evaluates concept-opportunity alignment on evidence backing, market data completeness, and opportunity strength
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
      review_analyzer.py # Data-driven complaint extraction (n-gram NLP)
      scoring.py         # Opportunity scoring + market sizing
      concept_generator.py # PM-ready concept briefs
      brand_fit.py       # Brand fit scoring
      scraper.py         # Live scrapers (Reddit, Trends, Amazon, Flipkart)
      ai_adapter.py      # LLM integration placeholder
    routes/
      scrape.py          # /scrape/* endpoints for live data collection
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
      scraping.jsx       # Live data scraping interface

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

| Method | Endpoint              | Description                            |
|--------|-----------------------|----------------------------------------|
| GET    | `/`                   | Health check                           |
| GET    | `/health`             | Detailed health status                 |
| POST   | `/scrape/all`         | Scrape all sources (Reddit+Trends+Amazon+Flipkart) |
| POST   | `/scrape/reddit`      | Scrape Reddit posts for keywords       |
| POST   | `/scrape/trends`      | Fetch Google Trends data               |
| POST   | `/scrape/reviews`     | Scrape Amazon/Flipkart reviews         |
| POST   | `/scrape/competition` | Build competition landscape            |
| GET    | `/analysis/complaints`| Complaint analysis                     |
| GET    | `/analysis/opportunities` | Scored opportunities               |
| GET    | `/analysis/concepts`  | Generated product concepts             |
| POST   | `/analysis/run`       | Full pipeline (complaints→opportunities→concepts) |
| POST   | `/upload/reviews`     | Upload reviews CSV                     |
| POST   | `/upload/reddit`      | Upload Reddit CSV                      |
| POST   | `/upload/trends`      | Upload trends CSV                      |
| POST   | `/upload/competition` | Upload competition CSV                 |
| POST   | `/upload/cumulative`  | Upload combined CSV                    |

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
