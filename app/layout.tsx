import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, DM_Sans } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cronly — Plain English to Cron Expressions",
  description:
    "Type a schedule in plain English, get a perfect cron expression instantly. " +
    "Supports all major cron formats, next-run previews, shareable links, and more. " +
    "Runs 100% offline.",
  keywords: [
    "cron", "cron expression", "cron generator", "cron parser",
    "crontab", "scheduler", "devtools", "cron to english",
  ],
  metadataBase: new URL("https://cronly.app"),
  openGraph: {
    title: "Cronly — Plain English to Cron",
    description: "The cron expression tool developers actually enjoy using.",
    type: "website",
    url: "https://cronly.app",
  },
  twitter: {
    card: "summary",
    title: "Cronly — Plain English to Cron",
    description: "Type a schedule, get a perfect cron expression. Runs offline.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}
    >
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
