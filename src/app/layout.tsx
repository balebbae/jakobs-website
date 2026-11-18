import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import "../styles.css";

export const metadata: Metadata = {
  title: "Glow Progress Board",
  description: "Track seven goals with progress bars, notes and background pictures.",
  openGraph: { title: "Glow Progress Board", description: "Track seven goals with progress bars, notes and background pictures.", type: "website" },
  twitter: { card: "summary" },
  icons: { icon: { url: "/favicon.ico", type: "image/x-icon" } },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
