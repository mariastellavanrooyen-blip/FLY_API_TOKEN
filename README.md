# 🐇 ExamReady — Exam Study Tracker

A pastel rustic (terracotta, cream & light beige) exam-prep command centre: chapter-by-chapter
subject progress, a study session log, an adjustable calendar with pop-up reminders, an exam
countdown you can start even before you know the exact date, and insight into which study method
is actually paying off for you. Built as a React web app that installs like a real app on your
phone, tablet or PC.

## 📲 Get it as an app on your phone/tablet/PC

ExamReady is a real installable app (a "PWA") — no app store, no download link needed, just a
webpage you can install in a couple of clicks. It works fully offline once installed.

**One-time setup (about 30 seconds), done by whoever owns the GitHub repo:**

1. On GitHub, open this repo → **Settings** → **Pages** (left sidebar, under "Code and automation").
2. Under **Build and deployment → Source**, choose **GitHub Actions**, then save.
3. Go to the **Actions** tab → **Deploy frontend to GitHub Pages** → **Run workflow**
   (it's manual-trigger only, so pushing alone won't deploy it — see
   `.github/workflows/deploy-pages.yml`). Takes about a minute the first time.
4. Once it finishes, your app is live at:
   `https://<your-github-username>.github.io/<this-repo-name>/`
   (GitHub shows the exact URL at the top of the Pages settings page once it's live.)

**Then, to install it:**

- **On your phone/tablet** (Chrome/Safari): open that URL, then **Add to Home Screen** from the
  browser menu. It'll sit on your home screen with its own icon and open full-screen.
- **On your PC** (Chrome or Edge): open the URL, click the **install icon** in the address bar (a
  little monitor-with-arrow icon), or **⋮ menu → Save and share → Install…**.

Don't want to touch GitHub settings? Run it locally instead — see
[Running the app locally](#running-the-app-locally) below, then open
`http://localhost:4173` after `npm run build && npm run preview` and install it from there.

## Features

- **Dashboard** — a countdown hero to your nearest exam (even a rough "sometime in October" one),
  this week's study time against your weekly goal, how many subjects are keeping pace, subject
  progress bars at a glance, and upcoming calendar items.
- **Subjects** — one card per subject: how many chapters it has, the window you've given yourself
  to finish it, a progress bar, and a pace indicator (on track / behind) worked out from your
  target date and how many chapters you've actually completed so far.
- **Chapter Log** — the session-by-session log: subject, chapter, date, time spent, the study
  method you used, a 1–5★ confidence/understanding rating, and whether that chapter is now fully
  done. This is what both the subject progress bars and the study-method insights are built from.
- **Calendar** — an adjustable month calendar for study sessions, deadlines and anything else,
  colour-coded by type, with an upcoming list on the side. Confirmed exam dates show up on it
  automatically. Mark any event "pop up a reminder" and you'll get an in-app banner (plus a real
  browser notification if you've granted permission) when that day arrives.
- **Exams** — your exam countdowns. Don't know the exact date yet? Add just the month you're
  expecting (October, November, …) and get a rough countdown to the 1st of that month, styled
  differently so you know it's an estimate — swap in the real date the moment you have it, and
  everything (dashboard, calendar, reminders) updates from that one place.
- **Study Methods** — logs every session's method and confidence rating, then ranks methods by
  average confidence-per-session so you can see, from your own data, which technique (active
  recall, spaced repetition, flashcards, practice questions, and more) is actually maximizing what
  you retain — plus quick reference notes on each technique and room to add your own.
- **Settings** — your name, weekly study-hour goal, notification permission, data export/import/
  reset.

Everything is stored locally on-device — nothing leaves your browser, and there's no account or
backend needed.

## About reminders

This is a plain front-end app with no server, so it can only remind you **while the app is open**
(or backgrounded, not fully closed) — there's no push server able to wake a closed app. In
practice that means:

- Every time you open the app, it checks today's calendar events and your exam countdowns against
  your reminder points, and shows a banner if something's due — this always works.
- If you also grant browser notification permission (**Settings → Reminders**), you'll get a real
  pop-up notification too, which is handy if you keep the app open in a background tab.

## About syncing between devices

Data is stored only on the device it was entered on — installing the app on multiple devices gives
you the same *app*, not automatically shared *data*. To move your data across, use **Settings →
Export backup** on one device and **Import backup** on the other.

## Running the app locally

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

To build a static production bundle (deployable to GitHub Pages, Netlify, Vercel, or any static
host):

```bash
cd frontend
npm run build   # outputs to frontend/dist
npm run preview # serve the production build locally to test/install it
```

## Project structure

```
frontend/               React + Vite app — the whole app, works fully offline
.github/workflows/      GitHub Actions workflow that builds & deploys frontend/ to GitHub Pages
```

## Customizing

- Rename the app and your name, and set your weekly study-hour goal, from **Settings** — no code
  changes needed.
- Theme colors (the terracotta/cream/beige palette) are CSS variables at the top of
  `frontend/src/theme.css`.
- Calendar/exam event types (Study session / Exam / Deadline / Other) are defined in
  `frontend/src/lib/utils.js` (`EVENT_TYPES`), and the built-in study methods in the same file
  (`DEFAULT_METHODS`) — you can also add custom methods from the Study Methods page.
