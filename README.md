# WeLocals – Hyperlocal Marketplace (Full-Stack, Docker)

This bundle gives you a **ready-to-run** MVP:
- **Backend:** FastAPI + SQLite (auth, shops, products, community posts)
- **Frontend:** React + Vite (PWA-ready)
- **One command run:** `docker compose up`

## Quick Start
1. Install Docker + Docker Compose.
2. Unzip the project and open a terminal in the project folder.
3. Run: `docker compose up`  
   - Frontend: http://localhost:5173  
   - Backend:  http://localhost:8000/docs

## Default Flows
- Register/login (email + password). Optionally tick **"Register as shop owner"**.
- Create a shop, add products from **Profile** page.
- Browse shops/products on **Shops** and **Home** pages.
- Post on **Community** board (buy-sell, lost-found, events).

## Notes
- Payments, maps and delivery are **stubbed**. Integrate Razorpay & Google Maps as next steps.
- DB is SQLite file inside the backend container volume `backend_data`.
- ENV like `SECRET_KEY`, `CORS_ORIGINS` are in `docker-compose.yml`.

Enjoy building 🚀
