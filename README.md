# CareLog — Prototype

A single-file prototype for CareLog, a caregiver-facing daily log for medications, vitals, meals, mood, and sleep.

## Run

Open `index.html` in any modern browser — no build step, no dependencies.

## What's in it

- **Today dashboard** — KPI row (adherence, sleep, resting HR, mood) with at-a-glance trend deltas.
- **Timeline** — mixed manual and auto-captured entries (BP cuff, glucose) with contributor tags.
- **Weekly wellbeing ring** — composite score with legend (adherence, sleep, activity, mood).
- **Quick log** — one-tap entry for medication, meal, vitals, mood.
- **Up next** — schedule with a live "now" slot.

## Design notes

- Type pairing: Fraunces (display) + Inter (UI).
- Color system uses OKLCH tokens with semantic accents (mint/cool/warm/rose).
- Fully responsive; collapses sidebar below 900px.
- Respects `prefers-color-scheme` and `prefers-reduced-motion`.

This is intentionally a single static HTML file so the prototype can be shared and previewed anywhere.
