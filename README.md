# Faith

A local-first Christian app. Everything is stored on the person's device, and they choose what to share.

## Sections

| Section | What it does | Privacy |
|---|---|---|
| **Answered** | Prayer journal that brings prayers back on a revisit date ("Did anything happen?") and keeps answered prayers as *stones of remembrance* | 🔒 Private; optionally shares one short line with a circle |
| **Circle: Burdens** | Share a need with your group, pray for it, and claim practical help (meals, rides, childcare…) | 👥 Circle |
| **Circle: Accountability** | Weekly pact with one partner, using Wesley-style questions; you choose answer by answer what your partner sees | 🔒 / 👥 per answer |
| **Walk** | One daily Scripture-based action step; tracks steps lived out, not chapters read | 🔒 Private |
| **Sermons** | Sermon notes with Mon/Wed/Fri follow-through. Each theme has its own layout (scroll, cards or journal), colours and decoration, and every page can be customised, including section order and visibility | 🌍 / 🔒 |

## How sharing works (for now)

There is no server yet. Shared items are packed into the `#fragment` of a link, which browsers never send to a server, and the person sends it through WhatsApp, SMS or email. When the recipient opens the link, a preview appears with a **Save to my app** button. Needs that are re-shared merge prayers and task claims, so a circle stays roughly in sync.

Settings has **Download backup** and **Restore**, so a lost phone doesn't mean lost prayers.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # typecheck + production build in dist/
```

Built with React, TypeScript, Vite, Dexie (IndexedDB) and Leaflet. It is an installable PWA that works offline after the first visit. Scripture quotations are from the NIV; the required copyright notice is shown in Settings → About. The app quotes well under the 500-verse limit of Biblica's free-quotation permission. If you plan to sell the app or add many more verses, check [biblica.com/permissions](https://www.biblica.com/permissions/) first.
