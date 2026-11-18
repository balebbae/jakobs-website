<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep photo editing in a dedicated background-photo module; render photos beneath opaque dashboard controls so movement and formatting never cover text or inputs.
- Keep main and mini note groups unframed with shared proportional width calculations, wrapping the mini group above-left on narrow screens to preserve the original four-note row.
- Keep dashboard tabs mounted with independent state in the glow-board module; collect all home and dashboard content into explicit snapshots for save and restore.
- Keep home photo state mounted alongside dashboard state and reuse the photo module's insertion and pointer gestures so every screen has the same editing behavior.
- Share checklist-aware paragraph editing between main and mini notes, encoding checkbox lines in note text so snapshots retain completion.
- Store whole-board snapshots in owner-scoped Cloud slots using verified workspace identity and RLS, never admin access, to keep saves private.
- Keep editable graphs in a dedicated bar-graph module and dashboard snapshots, defaulting missing graph arrays to empty so earlier saves remain compatible.
- Store at most seven child dashboard contents under each parent and keep them mounted through the shared dashboard renderer; snapshot defaults preserve older saves and independent child edits.
- Keep home zoom and background panning in the board snapshot as view-only transforms, moving the moon and photos together and scaling photo gesture deltas inversely to retain stored coordinates.
- Serialize manual and automatic slot writes through the board persistence hook; recover owner-scoped browser drafts only after verifying workspace identity to avoid cross-user restoration and stale writes.
- Reorder tabs through board-state helpers and axis-specific pointer gestures so saved array order and active content remain aligned; movement cancels the subtab deletion hold.
- Keep dashboard pan/zoom in DashboardView with a per-dashboard view in snapshots; inserted progress and paragraph boxes live in floating-boxes and divide gesture deltas by zoom so stored coordinates stay stable.
- Original dashboard bars/paragraphs are a movable floating-box template; only items[0] stays fixed as the anchor for the insert buttons, and the schema migrates older 4+3 saves into floating boxes.
- Generate new dashboard templates separately from legacy snapshot migration so new defaults never rename or reposition saved content.
- Share metric editing between anchor and floating boxes, persisting optional box-mode fields in snapshots so older saves remain compatible.
- Checkbox metric boxes keep a rigid single-line title and a digit-fitted total, with resize floors measured from the heading; clipping the square area never changes completion data.
- Use a single pre-rendered low-resolution home dragon clip and pause it offscreen or in reduced-motion mode to avoid a live 3D rendering workload.
