import { createFileRoute } from "@tanstack/react-router";
import { GlowBoard } from "@/components/glow-board";
import { readOpeningBoard } from "@/lib/board-saves.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glow Progress Board" },
      { name: "description", content: "Track seven goals with progress bars, notes and background pictures." },
      { property: "og:title", content: "Glow Progress Board" },
      { property: "og:description", content: "Track seven goals with progress bars, notes and background pictures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // Slot 1 arrives with the first page so the app opens straight onto it.
  loader: () => readOpeningBoard(),
  component: function Index() { return <GlowBoard opening={Route.useLoaderData()} />; },
});

