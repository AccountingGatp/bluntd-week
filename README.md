# Bluntd

Next.js frontend with shadcn/ui, an Express API, and MongoDB.

## Folders

- `frontend` — Next.js 16, Tailwind CSS, shadcn/ui (port 3000)
- `backend` — Express.js + TypeScript + MongoDB (port 4000)

## Run locally

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000/gusto](http://localhost:3000/gusto) for employees, or [http://localhost:3000/generation](http://localhost:3000/generation) to upload a QuickBooks Time CSV and download a Republic Supply Company general ledger Excel file. The ledger is built in memory and is not stored on the server.

If `MONGODB_URI` is not set, the API tries local MongoDB at `mongodb://127.0.0.1:27017/bluntd`. If that is not running, it starts an embedded MongoDB and stores data in `backend/data/mongo`.
