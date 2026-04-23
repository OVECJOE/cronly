import type { Metadata } from "next";
import { ReverseClient } from "@/components/ReverseClient";
export const metadata: Metadata = {
  title: "Decode Cron Expression — Cronly",
  description: "Paste any cron expression and get a plain English explanation, next run times, and a calendar preview.",
};
export default function ReversePage() { return <main><ReverseClient /></main>; }
