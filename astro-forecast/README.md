# Celestial Forecast

A single-page astrological forecast web app that generates personalized daily guidance for two people: **Me** and **ORYNE**.

## How to Use

1. Open `index.html` in any modern web browser (no build tools or server required).
2. On first visit, select a zodiac sign for "Me" and a zodiac sign for "ORYNE", then click **Reveal the Stars**.
3. The app displays a full daily forecast for each person including:
   - Overall Energy (with percentage meter)
   - Love & Relationships
   - Career & Finance
   - Health & Wellness
   - Lucky Numbers
4. A **Cosmic Compatibility** section analyzes how the two chosen signs interact today, covering emotional bond, communication, shared adventures, and daily advice.
5. Forecasts are deterministic: the same date + sign combination always produces the same reading. Content changes automatically each day.
6. Zodiac sign selections are saved in `localStorage`, so they persist across visits. Click **Change Signs** in the header to update them.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and layout |
| `styles.css` | Cosmic-themed styling, animations, responsive design |
| `app.js` | Forecast generation, star animation, all application logic |

## Features

- Dark cosmic background with animated twinkling stars and a glowing moon
- Deterministic daily forecasts using a seeded random number generator
- Rich astrological language referencing planets, houses, aspects, and elements
- Responsive layout (side-by-side on desktop, stacked on mobile)
- No external dependencies beyond Google Fonts
