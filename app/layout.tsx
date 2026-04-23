import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cronly — Plain English to Cron Expressions",
  description: "Type a schedule in plain English, get a perfect cron expression instantly. Supports all major cron formats, timezone-aware previews, shareable links, and more.",
  keywords: ["cron", "cron expression", "cron generator", "cron parser", "scheduler", "devtools"],
  openGraph: {
    title: "Cronly — Plain English to Cron",
    description: "The cron expression tool developers actually enjoy using.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
