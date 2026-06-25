# Financial Health Analysis Tool

A web app for analyzing personal finances by uploading PDF bank statements. It parses transactions, categorizes spending, computes a financial health score, and generates personalized recommendations.

## Google Drive Files:

https://drive.google.com/drive/folders/1WKsXEhIwqcDku60BhW0q7FX3M6OxysZ4?usp=sharing

## Features

- **PDF Upload & Parsing** — upload any bank statement PDF; the app extracts and categorizes transactions automatically
- **Spending Categories** — rent, groceries, food, dining, shopping, entertainment, other
- **Financial Health Score** — 0–100 score based on how closely spending matches configurable benchmarks
- **Benchmark Comparison** — side-by-side table of your spending percentages vs. recommended targets
- **Pie Chart Visualization** — interactive spending breakdown by category
- **Personalized Recommendations** — targeted advice for overspending categories, ranked by priority
- **Upload History** — view and revisit past monthly analyses per user account
- **Auth** — local signup/login with per-user data isolation (stored in `localStorage`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Chart.js + react-chartjs-2 |
| PDF Parsing | pdfjs-dist |
| Auth & Storage | Browser `localStorage` |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to `/login` to create an account.

## How It Works

1. **Sign up / Log in** at `/login` or `/signup`
2. **Upload a PDF** bank statement on the dashboard (`/dashboard`)
3. **Select the statement month** — data is stored per user per month
4. The app parses every line, extracts dollar amounts, and classifies each transaction into a category
5. Results are passed to the scoring engine, which compares your spending percentages against a benchmark profile
6. View the full breakdown on the **Analysis** page (`/analysis`): pie chart, score, benchmark table, and recommendations

## Project Structure

```
app/
  dashboard/page.tsx        # PDF upload, parsing, categorization
  analysis/page.tsx         # Score display, pie chart, recommendations
  login/page.tsx            # Login flow
  signup/page.tsx           # Signup flow

lib/
  auth.ts                   # localStorage-based auth helpers
  uploads.ts                # Per-user upload history
  scoring/
    scoreCalculator.ts      # Financial score algorithm
    categoryBreakdown.ts    # Aggregates transactions by category
    scoreTypes.ts           # Shared types
  benchmarks/
    benchmarkProfile.ts     # Default spending benchmarks
  recommendations/
    recommendationEngine.ts # Priority-ranked recommendation logic

components/
  ScoreCard.tsx             # Score display component
  CategoryBreakdown.tsx     # Category breakdown component
```

## Scoring Model

The score starts at 100 and is penalized for deviations from benchmark spending percentages:

```
score = 100 - (sum of |userPercent - benchmarkPercent| × penaltyFactor)
```

| Score | Risk Level |
|---|---|
| 80–100 | EXCELLENT |
| 60–79 | GOOD |
| 40–59 | FAIR |
| 0–39 | POOR |

The default benchmark profile and penalty factor can be adjusted in `lib/benchmarks/benchmarkProfile.ts`.

## Limitations

- Auth and all data are stored in `localStorage` — no backend or database
- PDF parsing relies on text extraction; scanned/image-based PDFs will not parse correctly
- Transaction categorization is keyword-based and may misclassify edge cases

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
