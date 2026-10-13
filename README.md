# DreH booking site (concept mockup)

Static site: no build step.

    index.html   page structure
    styles.css   all styling
    script.js    all interactions (slot board, photo check, client page, gifts, studio view)
    images/      portrait-1.png, portrait-1-photo.png, portrait-2.png

## Deploy on Vercel
1. Put this folder in a GitHub repo and import it at vercel.com/new. Set Framework Preset to "Other" and leave build settings empty.
   Or run `npx vercel` inside this folder.
2. Every push redeploys it.

## Before it becomes his real site
- Remove the "Notes for you" toggle (`.tog` in the header) and the yellow `.annot` notes.
- Remove the "Preview the page when" switch in the hero.
- Replace the placeholder prices, names, queue and dates.
- Swap the stand-in progress photos for his real work-in-progress shots in `images/`.
- Deposits, the waitlist, messages and the gift checkout are simulated. They need a backend or services (for example Stripe and an email provider) to become real.
