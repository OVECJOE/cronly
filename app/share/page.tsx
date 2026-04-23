import type { Metadata } from "next";
import { ShareClient } from "@/components/ShareClient";
export const metadata: Metadata = {
  title: "Shared Expression — Cronly",
  description: "View a shared cron expression.",
};
export default function SharePage() { return <main><ShareClient /></main>; }
