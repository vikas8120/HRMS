# HRMS Frontend (Demo Mode)

## Tech Stack
- Frontend: React + Vite
- Data mode: Seeded frontend demo API (no backend required)

## Project Structure
- `frontend/` Complete HRMS UI and demo data layer

## Setup
```bash
cd frontend
npm install
npm run dev
```

## Demo Login
- `super@demo.com` / `demo123`
- `admin@demo.com` / `demo123`
- `hr@demo.com` / `demo123`
- `manager@demo.com` / `demo123`
- `employee@demo.com` / `demo123`

## Notes
- Demo API and seed data are in `frontend/src/mocks/demoApi.js`.
- Axios entry point is `frontend/src/api/axios.js`.
- Seed data persists in browser `localStorage` for continuity across refresh.

## Troubleshooting
1. If PowerShell blocks `npm`, use `npm.cmd`.
2. If seeded demo state gets messy, clear site storage/localStorage and reload.
