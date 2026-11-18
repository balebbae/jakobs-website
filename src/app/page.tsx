import { GlowBoard } from "@/components/glow-board";
import { readOpeningBoard } from "@/lib/board-saves.server";

// Saves are per visitor, so the page is rendered for each request.
export const dynamic = "force-dynamic";

export default async function Home() {
  return <GlowBoard opening={await readOpeningBoard()} />;
}
