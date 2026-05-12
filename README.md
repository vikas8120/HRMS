# HRMS Super Admin Portal

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express.js
- Database: MongoDB Atlas + Mongoose
- Auth: JWT

## Project Structure
- `frontend/` Super Admin UI and module pages
- `backend/` APIs, models, middleware, and seed scripts

## Prerequisites
- Node.js 18+
- MongoDB Atlas cluster URI

## Backend Setup
```bash
cd backend
npm install
```

Create/update `backend/.env` (or copy `backend/.env.example`):
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/hrms_superadmin?retryWrites=true&w=majority
JWT_SECRET=use_a_strong_random_secret_at_least_32_characters
JWT_EXPIRES_IN=1d
```

Seed Super Admin:
```bash
npm run seed
```

Run backend:
```bash
npm run start
```
Or dev mode:
```bash
npm run dev
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Optional API override (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

## Login
- Email: `superadmin@hrms.com`
- Password: `Admin@123`

## Health Check
- `GET http://localhost:5001/api/health`

## Notes
- All protected APIs require `Authorization: Bearer <token>`.
- All frontend API calls use shared axios instance: `frontend/src/api/axios.js`.
- Backup/restore and integration test flows are simulated but persisted in MongoDB documents.
- Reports export buttons generate mock export records and download URLs.

## Troubleshooting
1. If PowerShell blocks `npm`, use `npm.cmd`.
2. If login fails, re-run `npm run seed` in `backend`.
3. If CORS errors appear, verify frontend URL is `http://localhost:5173` or `http://localhost:3000`.
4. If database errors appear, verify `MONGO_URI` points to your Atlas cluster and network access is allowed.
