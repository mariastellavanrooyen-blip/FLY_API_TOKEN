# Penny Plan

A single-file envelope budgeting app (`index.html`, no build step).

- **Plan**: enter your take-home pay once; it builds envelopes using the 50 / 30 / 20 guide
  (needs / wants / savings & debt). Each month's plan carries forward until you change it.
- **Track**: add spending in a few keystrokes (press `N`, type an amount, pick an envelope,
  Enter). Frequent envelopes appear as one-tap chips. Undo is on every add and delete.
- **Decide**: see what's left to spend, a safe-to-spend-per-day figure, unassigned money,
  a pace marker on each envelope, your plan's balance against 50 / 30 / 20, and a
  six-month spending trend.

Storage: published as a claude.ai Artifact it saves to the owner's account (readable only
by the owner). Opened directly in a browser it saves to that browser's `localStorage`.

## Install it on your phone

Penny Plan installs like an app from a web address: home-screen icon, opens full screen,
works offline. GitHub Pages hosts it for free.

**One-time setup on GitHub (done once, on a computer is easiest):**

1. Merge this branch into `main`.
2. Repo → **Settings** → **Pages** → under **Build and deployment → Source** choose **GitHub Actions**.
3. Repo → **Actions** → **Deploy frontend to GitHub Pages** → **Run workflow** (on `main`).
   It takes about a minute. Run it again whenever the app changes.
4. The app is then at `https://mariastellavanrooyen-blip.github.io/FLY_API_TOKEN/budget/`.

**On your phone, open that address, then:**

- **iPhone:** in **Safari**, tap **Share** → **Add to Home Screen** → **Add**.
- **Android:** in **Chrome**, tap **⋮** → **Add to Home screen** (or **Install app**) → **Install**.

Your budget is stored on the phone itself. Under **Edit plan → Backup** you can save a backup
file and restore it later or on a new phone. Deleting the app or clearing the browser's
site data erases the budget, so keep a recent backup.

To build the app files yourself: `node budget/build.mjs <out-dir>` (no dependencies needed).

### Publishing without the Actions workflow

`docs/` holds a ready-built copy of the app, so GitHub Pages can serve it straight from
this branch: **Settings → Pages → Source: Deploy from a branch → Branch:
`ccr-19fa46d7-63i5jt`, folder `/docs` → Save**. After changing `budget/index.html`,
rebuild it with `node budget/build.mjs docs/budget` and commit.
