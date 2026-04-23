# Cronly ⏱

> Plain English to cron expressions. Instantly.

Type any schedule in natural language, get a production-ready cron expression with next run times, a calendar preview, conflict detection, and export to 8 different formats.

---

## Features

| Feature | Details |
|---|---|
| **Natural language → cron** | Regex parser (instant) + on-device AI fallback (downloads once, ~60MB, cached forever) |
| **Cron → English** | Decode any expression into plain language |
| **Calendar preview** | Visual month grid showing exactly which days will run |
| **Next 7 runs** | Real timestamps with relative countdowns |
| **8 output formats** | Standard, Quartz, AWS EventBridge, Kubernetes, GitHub Actions, Node.js, Python, Go |
| **Conflict detector** | Check if two cron expressions overlap in the next 24 hours |
| **Shareable URLs** | Every expression gets a `cronly.app/share#...` link, no backend needed |
| **Saved library** | localStorage history with search, export, and import |
| **No backend** | Pure Next.js, everything runs in the browser |

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router (all server components with individual metadata) |
| AI model | Transformers.js — `Xenova/LaMini-Flan-T5-248M` (~60MB, runs entirely in browser) |
| Fallback | Custom regex/grammar parser (handles ~90% of inputs instantly with zero latency) |
| Styling | CSS variables, dark terminal aesthetic — Fraunces serif + JetBrains Mono |
| State | URL hash for sharing, localStorage for history |
| Backend | None |

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — no API keys, no `.env` file needed.

---

## How the AI model works

On first load, a Web Worker downloads `Xenova/LaMini-Flan-T5-248M` from HuggingFace via CDN (~60MB). The download progress is shown in the amber badge at the top of the translator page. Once downloaded, the model is cached in IndexedDB and never re-downloaded.

**The model runs 100% in the browser** — no server, no API calls, no data leaves the device.

The regex parser handles all inputs while the model downloads, so the tool is fully functional immediately. The model takes over for ambiguous or complex inputs the regex can't confidently parse.

---

## AI model tradeoff

If you'd rather skip the model download entirely and use only the regex parser, remove the Web Worker initialization block in `components/TranslatorClient.tsx` (the `useEffect` that creates the worker). The tool remains fully functional — the regex parser covers the overwhelming majority of real-world schedule descriptions.

To swap in a different model, change the model name in the worker blob string inside `TranslatorClient.tsx`:
```js
'Xenova/LaMini-Flan-T5-248M'  // ~60MB — recommended
'Xenova/t5-small'              // ~120MB — more capable
```

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Natural language → cron |
| `/reverse` | Cron expression → English |
| `/history` | Saved expressions library |
| `/share` | View a shared expression (decoded from URL hash) |

---

## Project structure

```
app/
  layout.tsx           # Root layout + global SEO metadata
  page.tsx             # Translate page (server component)
  reverse/page.tsx     # Decode page (server component)
  history/page.tsx     # Saved library page (server component)
  share/page.tsx       # Shared expression viewer (server component)
  globals.css          # Design tokens + animations

components/
  TranslatorClient.tsx # Main translator — AI worker, input, result, share
  ReverseClient.tsx    # Decoder — expression input, conflict checker
  HistoryClient.tsx    # Saved expressions — filter, export, import
  ShareClient.tsx      # URL hash decoder + expression display
  Navbar.tsx           # Navigation with active state
  CronDisplay.tsx      # Animated 5-part expression with field labels
  CalendarPreview.tsx  # Navigable month calendar grid
  NextRuns.tsx         # Next 7 run timestamps with relative time
  OutputFormats.tsx    # 8-format code output with copy
  ModelStatus.tsx      # AI download progress badge

lib/
  cronEngine.ts        # Parser, validator, next runs, conflict detector, output formats
  storage.ts           # localStorage CRUD with export/import
  aiWorker.ts          # Web Worker script string (reference)
```

---

## Deployment

Works on any platform. Vercel is the easiest:

```bash
npx vercel
```

No environment variables required.

---

## License

MIT
# cronly
