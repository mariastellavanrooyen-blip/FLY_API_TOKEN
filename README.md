# 🍲 The Wife's Brain — Household Planner

A cream, sage-green and terracotta household command centre: a shared calendar for
family and kids' things, a two-income budget tracker with monthly reports, a recipe
box with photos, and a shopping list with trip-day reminders. Built as a React web
app that installs like a real app on both your tablet and your PC.

## 📲 Get it as an app on your tablet and PC

The Wife's Brain is a real installable app (a "PWA") — no app store, no download
link needed, just a webpage you can install in a couple of clicks. It works fully
offline once installed.

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

- **On your PC** (Chrome or Edge): open that URL, click the **install icon** in the
  address bar (a little monitor-with-arrow icon), or **⋮ menu → Save and share →
  Install…**. It becomes its own app with its own icon, no browser tabs or address bar.
- **On your tablet** (Chrome/Safari): open the URL, then **Add to Home Screen** from
  the browser menu. It'll sit on your home screen with its own icon and open full-screen.

Don't want to touch GitHub settings? Run it locally instead — see
[Running the app locally](#running-the-app-locally) below, then open
`http://localhost:4173` after `npm run build && npm run preview` and install it
from there the same way.

## Features

- **Dashboard** — this month's balance at a glance, upcoming calendar events, next
  planned shopping trip, recipe count, and quick links into everything else.
- **Calendar** — a month grid for household and kids' things: appointments, school
  events, chores — colour-coded by category, with an upcoming list on the side.
- **Budget** — the detailed money tracker:
  - **Income**, split by who earns it — a regular monthly amount per partner (salary
    etc.) plus one-off "additional income" per month (bonuses, side jobs, gifts).
  - **Expenses**, tagged by category (Food & Groceries, Kids, Household & Bills,
    Transport, Health, Other — fully customisable) with a running monthly total.
  - **Reports** — pick any month to see both partners' income, total spent, the
    balance left over, a spend-by-category breakdown, and a 6-month trend. Reports
    are calculated live from your saved entries, so nothing is ever out of date.
- **Recipe Box** — your brain-dump of go-to meals: a photo (tap to upload — it's
  compressed automatically so it doesn't eat your storage), ingredients as a
  checklist-style card, instructions, and notes. Search and filter by category.
  Any recipe's ingredients can be sent straight to a shopping list in one tap.
- **Shopping List** — one or more lists, each with tick-off checkboxes, a "reset
  ticks" button so you can reuse the same list next month, and an optional planned
  shopping-trip date. When you open the app on that date, a reminder banner appears
  automatically (with an optional real browser notification too — see below); mark a
  list "repeats monthly" and its date rolls forward on its own after each trip.
- **Settings** — household/partner names, currency symbol, budget categories,
  notification permission, data export/import/reset, and recipe-photo storage.

Everything is stored locally on-device — nothing leaves your browser, and there's no
account or backend needed.

## About the shopping-day reminder

This is a plain front-end app with no server, so it can only remind you **while the
app is open** (or backgrounded, not fully closed) — there's no push server able to
wake a closed app. In practice that means:

- Every time you open the app, it checks today's date against your lists' planned
  trip dates and shows a banner if one matches — this always works.
- If you also grant browser notification permission (**Settings → Shopping-day
  reminders**), you'll get a real pop-up notification too, which is handy if you
  keep the app open in a background tab.

## About syncing between your tablet and PC

Data is stored only on the device it was entered on — installing the app on both
your tablet and PC gives you the same *app*, not automatically shared *data*. To
move your data across, use **Settings → Export backup** on one device and
**Import backup** on the other. (Recipe photos live in separate on-device storage
and aren't included in that backup file — re-add photos on the second device if you
want them there too.)

## Running the app locally

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

To build a static production bundle (deployable to GitHub Pages, Netlify, Vercel, or
any static host):

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

- Rename your household, partners, currency symbol, and budget categories from
  **Settings** — no code changes needed.
- Theme colors are CSS variables at the top of `frontend/src/theme.css`.
- Calendar event categories (Household / Kids / Appointment / Other) are defined in
  `frontend/src/lib/utils.js` (`EVENT_CATEGORIES`) if you want to add more.
