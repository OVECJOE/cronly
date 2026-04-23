import type { Metadata } from "next";
import { HistoryClient } from "@/components/HistoryClient";
export const metadata: Metadata = {
  title: "Saved Expressions — Cronly",
  description: "All your saved cron expressions in one place.",
};
export default function HistoryPage() { return <main><HistoryClient /></main>; }
