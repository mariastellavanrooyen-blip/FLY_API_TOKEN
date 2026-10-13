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
