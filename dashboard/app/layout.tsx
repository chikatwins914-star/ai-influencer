import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display-raw", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body-raw" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-raw", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Maria HQ — AI Influencer Ops",
  description: "Content operations dashboard for Maria's Instagram, Fanvue, and analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
