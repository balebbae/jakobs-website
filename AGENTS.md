# Glow Progress Board

Next.js (App Router) app hosted on Vercel. Save slots and uploaded videos live in Vercel Blob; there is no database. See README.md for setup.

## Where things are

- `src/app/` — routes: `page.tsx` (loads slot 1 on the server and renders the board), `api/blob/upload/route.ts` (Vercel Blob upload tokens for videos and large saves), error pages.
- `src/components/` — the board UI. All of it is client components; `glow-board.tsx` is the root.
- `src/hooks/use-board-persistence.ts` — autosave, manual saves, browser draft recovery.
- `src/lib/board-state.ts` — Zod schema for snapshots, defaults, and migration of older saves.
- `src/lib/board-saves.store.ts` — save layout in Blob: `saves/<owner>/slot-<n>/board-<random>.json`; the newest file in a folder is the save, older ones are deleted on the next listing. Files are never overwritten, so reads are never stale.
- `src/lib/board-saves.actions.ts` — server actions that list and write save slots. `board-saves.functions.ts` is the browser-side wrapper the UI calls.
- `src/lib/auth.server.ts`, `src/proxy.ts`, `src/lib/owner.ts` — save ownership: every browser gets an httpOnly `glow_owner` UUID cookie, and every query is filtered by it. To add real sign-in, change `getSessionUser()` only.
- `public/assets/` — the Horus eye image and the sleeping dragon clip.

## Commands

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm test`

Run `pnpm lint`, `pnpm test` and `pnpm build` before pushing.

## Rules

- Server actions return `{ ok, value | message }` instead of throwing, because Next.js hides thrown messages in production.
- A snapshot larger than 1 MB of JSON is uploaded by the browser straight to Blob, and every snapshot is downloaded by the browser straight from Blob, to stay under Vercel's 4.5 MB request limit. Keep that path when changing saves.
- Each Blob write or listing counts against the free plan's 2,000 monthly operations; do not add listings to the autosave path.
- Never read or write saves outside the folder of the owner id from `requireOwner()`.
- Keep photo editing in a dedicated background-photo module; render photos beneath opaque dashboard controls so movement and formatting never cover text or inputs.
- Keep main and mini note groups unframed with shared proportional width calculations, wrapping the mini group above-left on narrow screens to preserve the original four-note row.
- Keep dashboard tabs mounted with independent state in the glow-board module; collect all home and dashboard content into explicit snapshots for save and restore.
- Keep home photo state mounted alongside dashboard state and reuse the photo module's insertion and pointer gestures so every screen has the same editing behavior.
- Share checklist-aware paragraph editing between main and mini notes, encoding checkbox lines in note text so snapshots retain completion.
- Store whole-board snapshots in owner-scoped slots, every read and write confined to the owner cookie id folder, to keep saves private.
- Keep editable graphs in a dedicated bar-graph module and dashboard snapshots, defaulting missing graph arrays to empty so earlier saves remain compatible.
- Store at most seven child dashboard contents under each parent and keep them mounted through the shared dashboard renderer; snapshot defaults preserve older saves and independent child edits.
- Keep home zoom and background panning in the board snapshot as view-only transforms, moving the moon and photos together and scaling photo gesture deltas inversely to retain stored coordinates.
- Serialize manual and automatic slot writes through the board persistence hook; recover owner-scoped browser drafts only after verifying the owner id to avoid cross-user restoration and stale writes.
- Reorder tabs through board-state helpers and axis-specific pointer gestures so saved array order and active content remain aligned; movement cancels the subtab deletion hold.
- Keep dashboard pan/zoom in DashboardView with a per-dashboard view in snapshots; inserted progress and paragraph boxes live in floating-boxes and divide gesture deltas by zoom so stored coordinates stay stable.
- Original dashboard bars/paragraphs are a movable floating-box template; only items[0] stays fixed as the anchor for the insert buttons, and the schema migrates older 4+3 saves into floating boxes.
- Generate new dashboard templates separately from legacy snapshot migration so new defaults never rename or reposition saved content.
- Share metric editing between anchor and floating boxes, persisting optional box-mode fields in snapshots so older saves remain compatible.
- Checkbox metric boxes keep a rigid single-line title and a digit-fitted total, with resize floors measured from the heading; clipping the square area never changes completion data.
- Use a single pre-rendered low-resolution home dragon clip and pause it offscreen or in reduced-motion mode to avoid a live 3D rendering workload.
