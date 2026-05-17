# Stock Portfolio Suggestion Engine

A containerized Python + FastAPI backend with a React + Tailwind frontend.

## Architecture

- `backend/` - FastAPI service, SQLite persistence, portfolio allocation logic
- `frontend/` - React + Vite application, Tailwind UI styling
- `docker-compose.yml` - local development stack with backend and frontend services

## Quick start

1. Start the stack:
   ```bash
   docker compose up --build
   ```

2. Open the frontend:
   - http://localhost:5173

3. The backend API is available at:
   - http://localhost:8000
   - API docs: http://localhost:8000/docs

## Notes

- SQLite is used to minimize VM overhead.
- The frontend calls backend APIs through a Vite proxy defined in `frontend/vite.config.ts`.
- Current price fetching is stubbed and can be replaced later with a live market API.
