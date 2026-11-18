# Glow Progress Board

Next.js app for Vercel. Save slots and uploaded videos are stored in Vercel Blob; there is no database.

## Deploy on Vercel

1. Import the repository in Vercel (framework: Next.js, no extra settings).
2. Storage → Create → **Blob**, access **Public**, and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`.
3. Deploy (redeploy if the store was added after the first deploy).

Without the Blob store the board still works; saving reports an error and edits stay in the browser draft.

Free (Hobby) limits: 1 GB stored and 2,000 writes per month. Every save, autosave and video upload is one write.

## Run locally

```bash
pnpm install
vercel env pull .env.local   # or copy .env.example and paste the Blob token
pnpm dev
```

## Saves

Each browser gets a private anonymous id in an httpOnly cookie, and its ten save slots belong to that id. Save files are public Blob URLs under an unguessable folder named after that id. Saves do not follow a person to another browser or device. See `AGENTS.md` for where to change this.

## Scripts

`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm test`
