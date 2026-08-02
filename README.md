# 🐰 Burrow & Brief — Legal Studies Companion

A cream, terracotta and soft-beige themed study app for two law modules
(**Professional Ethics** and **Notarial Practice**, renameable in-app),
built as a React web app with an optional real-AI backend.

## 📲 Get it as an app on your laptop

Burrow & Brief is a real installable app (a "PWA") — no app store, no download link
needed, just a webpage you can turn into a desktop app in a couple of clicks. It works
fully offline once installed (Real AI mode still needs internet, everything else doesn't).

**One-time setup (about 30 seconds), done by whoever owns the GitHub repo:**

1. On GitHub, open this repo → **Settings** → **Pages** (left sidebar, under "Code and automation").
2. Under **Build and deployment → Source**, choose **GitHub Actions**, then save.
3. That's it — pushing to this branch already triggers the included workflow
   (`.github/workflows/deploy-pages.yml`), which builds the app and deploys it. Check the
   **Actions** tab for progress (~1 minute the first time).
4. Once it finishes, your app is live at:
   `https://<your-github-username>.github.io/<this-repo-name>/`
   (GitHub shows the exact URL at the top of the Pages settings page once it's live.)

**Then, to install it on your laptop:**

1. Open that URL in **Chrome** or **Edge**.
2. Click the **install icon** in the right side of the address bar (a little monitor-with-
   arrow icon), or open the **⋮ menu → Save and share → Install Burrow & Brief…**.
3. Confirm — it's now a real app: its own icon on your desktop/dock/start menu, opens in
   its own window (no browser tabs or address bar), and works offline.

On a phone, the same URL works via **Add to Home Screen** in the browser menu.

Don't want to touch GitHub settings? You can also just run it locally — see
[Running the frontend locally](#running-the-frontend-locally) below, then open
`http://localhost:4173` in Chrome/Edge after `npm run build && npm run preview` and
install it from there the same way.

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
frontend/               React + Vite app (the whole UI, works standalone in offline mode)
server/                 Express backend that calls the Claude API (only needed for Real AI mode)
.github/workflows/      GitHub Actions workflow that builds & deploys frontend/ to GitHub Pages
```

## Customizing

- Rename your modules, add chapters, and manage everything else from within the app —
  no code changes needed for day-to-day use.
- Study tips live in `frontend/src/lib/tipsData.js` if you want to add your own.
- Theme colors are CSS variables at the top of `frontend/src/theme.css`.
