# Restaurant & Cafe Inventory Management System

MERN stack (MongoDB, Express, React, Node.js) with TypeScript. Minimalist UI: black borders, white backgrounds.

## Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Setup

1. **Install dependencies**

   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

2. **Environment**

   - **Server**: Copy `server/.env.example` to `server/.env`. Set:
     - `MONGODB_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/inventory` or Atlas URI)
     - `JWT_SECRET` – Secret for JWT signing (use a strong value in production)
     - `PORT` – API port (default `5000`)
     - `CLIENT_URL` – Frontend origin for CORS (e.g. `http://localhost:5173` in dev)
   - **Client** (optional for dev): Create `client/.env` and set `VITE_API_URL=http://localhost:5000` only if the API is on a different host. In dev with Vite proxy, leave unset so requests go to `/api` on the same origin.

3. **Seed first user and categories**

   ```bash
   cd server && npm run seed
   ```

   Default login: **admin@example.com** / **admin123**

4. **Run in development**

   From repo root:

   ```bash
   npm run dev
   ```

   - API: http://localhost:5000  
   - App: http://localhost:5173 (proxies `/api` to the server)

## Pack for moving (zip without node_modules)

To zip the project and move it to another computer (no `node_modules`, build files, or `.env`):

```bash
npm install
npm run pack
```

This creates **inventory_system.zip** in the project folder. Excluded: `node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `.git`, `.cursor`, logs.

On the other computer:

1. Unzip **inventory_system.zip**
2. Open the **inventory_system** folder in a terminal
3. Run: `npm install`, then `cd server && npm install`, then `cd ../client && npm install`
4. Copy `.env.example` to `server/.env` (or create root `.env`) and set `MONGODB_URI`, etc.
5. Run `npm run dev` (and `npm run seed` in `server` if needed)

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Run server + client in dev     |
| `npm run build`| Build server and client        |
| `npm run start`| Run built server (after build) |
| `npm run pack` | Create inventory_system.zip (no node_modules/env) |

- **Server**: `npm run dev` (tsx watch), `npm run build` (tsc), `npm run start` (node), `npm run seed`
- **Client**: `npm run dev` (Vite), `npm run build`, `npm run preview`

## Deployment

### Backend

1. Set environment variables on your host (e.g. Railway, Render, Fly.io):
   - `MONGODB_URI` – production MongoDB connection string
   - `JWT_SECRET` – strong random secret
   - `CLIENT_URL` – production frontend URL (e.g. `https://your-app.vercel.app`)
   - `PORT` – often provided by the host

2. Build and start:
   ```bash
   cd server && npm run build && npm run start
   ```

### Frontend

1. Set build-time env: `VITE_API_URL` = your backend API URL (e.g. `https://your-api.railway.app`).

2. Build and serve static files:
   ```bash
   cd client && npm run build
   ```
   Upload the `client/dist` folder to Vercel, Netlify, or any static host.

### Summary

- **Database**: MongoDB Atlas (free tier) with connection string in `MONGODB_URI`.
- **Backend**: Deploy `server` to a Node host; expose the API URL.
- **Frontend**: Build `client` with `VITE_API_URL` pointing to that API; deploy `dist` to a static host. Users open the frontend URL only.
