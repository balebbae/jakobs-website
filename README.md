# Glow Progress Board

Next.js app for Vercel. Save slots are stored in Neon Postgres (Drizzle); uploaded videos are stored in Vercel Blob.

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm db:migrate              # creates the tables
pnpm dev
```

## Deploy on Vercel

1. Import the repository in Vercel (framework: Next.js, no extra settings).
2. Storage → add **Neon**. It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. Storage → add **Blob** (public store). It sets `BLOB_READ_WRITE_TOKEN`.
4. Create the tables once: `vercel env pull .env.local && pnpm db:migrate`.
5. Deploy.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Pooled Neon connection, used by the app |
| `DATABASE_URL_UNPOOLED` | Direct Neon connection, used by migrations |
| `BLOB_READ_WRITE_TOKEN` | Video uploads |

Without the database the board still works; saving reports an error and edits stay in the browser draft. Without the Blob token only video upload fails.

## Saves

Each browser gets a private anonymous id in an httpOnly cookie, and its ten save slots belong to that id. Saves do not follow a person to another browser or device. See `AGENTS.md` for where to change this.

## Scripts

`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`
