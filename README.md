# 🐰 Burrow & Brief — Legal Studies Companion

A cream, terracotta and soft-beige themed study app for two law modules
(**Professional Ethics** and **Notarial Practice**, renameable in-app),
built as a React web app with an optional real-AI backend.

## Features

- **Dashboard** — upcoming assignments, today's habits, goals in progress, your burrow at a glance, tip of the day
- **Assignments** — per-module tracker with due dates, priority and status
- **Goals** — target-dated goals broken into checkable milestones with a progress bar
- **My Burrow (memory)** — upload chapter PDFs, Word docs, text files or photos of your notes;
  the app remembers every upload, extracts its text, tracks your progress on it
  (New / In progress / Reviewed), and lets you jump straight into generating notes/quizzes
  from it. Persists across visits — see [My Burrow](#my-burrow-your-document-memory) below.
- **Modules & Assistant** — edit your two modules/chapters and chat with a study assistant
- **Notes & Quiz Generator** — paste chapter text in (or pull it straight from My Burrow);
  get bullet notes, a glossary and an auto-generated quiz (multiple choice / true-false /
  fill-in-the-blank) back out
- **Study Tips** — curated legal-study tips (exam technique, case briefing, essay writing,
  ethics, notarial practice, time management), favoritable
- **Study Timer** — Pomodoro-style focus/break timer that logs study minutes
- **Habit Tracker** — daily habit checklist with streaks and a 35-day heatmap
- **Settings** — profile, AI mode, storage usage, data export/import/reset

Everything is stored locally on your device — nothing leaves your browser unless you turn
on Real AI mode.

## My Burrow — your document memory

**My Burrow** is the app's built-in memory for your documents, progress and uploads. Drop in
a chapter PDF, a `.docx`, a plain text/markdown file, or a photo of handwritten notes:

- The file itself is remembered on-device in the browser's IndexedDB storage (far larger
  capacity than the small `localStorage` quota used for the rest of the app), so it survives
  reloads and browser restarts.
- Text is extracted automatically — natively for `.txt`/`.md`, via `pdf.js` for PDFs, and via
  `mammoth` for `.docx`. Photos need Real AI mode (below) to be read, using Claude's vision.
- Each document tracks its own **progress** — New → In progress → Reviewed — and automatically
  moves to "In progress" the first time you generate notes/quiz from it, with a running count
  of how many note sets came from it.
- From any document's preview you can jump straight into **Notes & Quiz** with its text
  pre-loaded, or pick it from a dropdown there directly.
- **Settings** shows how much on-device storage your burrow is using and lets you clear it
  independently of the rest of your data.

Note: the JSON export/import backup in Settings covers your document *list* (filenames,
status, links) but not the file contents themselves, which live only in this browser's
storage — export a copy of anything irreplaceable separately if you plan to clear your
browser data.

## Two AI modes

| Mode | What it does | Setup |
|---|---|---|
| **Offline (default)** | A local heuristic engine turns pasted text into notes/glossary/quiz, and a rule-based assistant answers common study questions. Free, private, instant. | None — works out of the box. |
| **Real AI (Claude API)** | Genuine understanding: better notes, better quizzes, a real conversational assistant. Costs a small amount per use. | Deploy `server/` (below), then paste its URL into **Settings → AI assistant**. |

Switch modes anytime in **Settings**.

## Running the frontend locally

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

To build a static production bundle (deployable to GitHub Pages, Netlify, Vercel, or any
static host):

```bash
cd frontend
npm run build   # outputs to frontend/dist
```

## Deploying the real-AI backend (Fly.io)

`server/` is a small Express API that proxies three endpoints to the Claude API:
`POST /api/generate` (notes + quiz), `POST /api/chat` (assistant replies), and
`POST /api/describe-image` (reads text out of photos uploaded to My Burrow). Your
Anthropic API key stays server-side and is never exposed to the browser.

1. Install the [Fly.io CLI](https://fly.io/docs/flyctl/install/) and `fly auth login`.
2. From the `server/` directory:
   ```bash
   cd server
   fly launch --no-deploy   # pick/confirm an app name — edit `app` in fly.toml too
   fly secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   fly deploy
   ```
3. Fly will print your app's URL, e.g. `https://burrow-and-brief-api.fly.dev`.
4. In the running frontend, go to **Settings → AI assistant → Real AI (Claude API)**,
   paste that URL into **Backend URL**, and click **Test connection**.

Optional environment variables on the backend:

- `ANTHROPIC_MODEL` — defaults to `claude-opus-5`. Set to `claude-sonnet-5` or
  `claude-haiku-4-5` for a cheaper/faster model if you're cost-conscious.
- `FRONTEND_ORIGIN` — restrict CORS to your deployed frontend's origin instead of `*`
  (recommended once you're not just testing locally).

Run it locally instead of on Fly:

```bash
cd server
npm install
ANTHROPIC_API_KEY=sk-ant-your-key-here npm start
```

then point the frontend's Backend URL at `http://localhost:8080`.

## Project structure

```
frontend/   React + Vite app (the whole UI, works standalone in offline mode)
server/     Express backend that calls the Claude API (only needed for Real AI mode)
```

## Customizing

- Rename your modules, add chapters, and manage everything else from within the app —
  no code changes needed for day-to-day use.
- Study tips live in `frontend/src/lib/tipsData.js` if you want to add your own.
- Theme colors are CSS variables at the top of `frontend/src/theme.css`.
