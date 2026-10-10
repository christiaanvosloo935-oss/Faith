# Setting up live sync, reminders and hosting

Everything here is free. You do each step once.

## 1. Supabase (live sync + reminders)

1. **Anonymous sign-ins:** Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins** → Save.
2. **Database:** SQL Editor → New query → paste all of [`supabase/setup.sql`](supabase/setup.sql) → Run. Success shows a row like `schedule: 1`.
3. **Reminder function:** Edge Functions → Deploy a new function → **Via Editor**.
   - Name it exactly `send-reminders`.
   - Replace the sample code with all of [`supabase/functions/send-reminders/index.ts`](supabase/functions/send-reminders/index.ts) → Deploy.
   - Open the function's **Details** tab, turn **off** "Enforce JWT verification" (or "Verify JWT") → Save. The 15-minute timer calls it without a login, and the function only ever sends reminders that are already due.
4. **Notification keys:** Edge Functions → **Secrets** → add:
   - `VAPID_PUBLIC_KEY`: the public key in [`src/config.ts`](src/config.ts) (`VAPID_PUBLIC_KEY`).
   - `VAPID_PRIVATE_KEY`: the private key (kept out of this repo; generate a new pair with `npx web-push generate-vapid-keys` if it's ever lost, and update both places).

## 2. Hosting (GitHub Pages)

Repo → Settings → Pages → Source: **GitHub Actions**. Every push to `main` then builds and publishes the app at
`https://christiaanvosloo935-oss.github.io/Faith/`.

## 3. Keeping the free project awake

Free Supabase projects pause after 7 days without activity. The **Keep Supabase awake** workflow
(`.github/workflows/keep-awake.yml`) makes one small request every day, so this is automatic.
If the project ever does pause, open the Supabase dashboard and click **Restore**.

## On phones

- **iPhone:** open the link in Safari → Share → **Add to Home Screen** → open Faith from the Home Screen → Settings → Turn on notifications.
- **Android:** open the link in Chrome → Install app (or Add to Home screen) → Settings → Turn on notifications.
- No notifications? **Add all upcoming reminders to my calendar** in Settings works everywhere.
