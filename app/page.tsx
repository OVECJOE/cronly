import type { Metadata } from "next";
import { TranslatorClient } from "@/components/TranslatorClient";

export const metadata: Metadata = {
  title: "Cronly — Plain English to Cron Expressions",
  description: "Type a schedule in plain English. Get a perfect cron expression instantly. Free, no account needed.",
};

export default function HomePage() {
  return (
    <main>
      <TranslatorClient />
    </main>
  );
}
