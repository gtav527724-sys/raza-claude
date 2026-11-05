# Deployment and APK Guide

See README.md for the full guide. Summary:

## Vercel + Neon

1. Push to GitHub, create a Neon project, import the repo in Vercel.
2. Set `DATABASE_URL` (+ optional `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `APP_URL`).
3. Deploy. The schema is created automatically on first server start (`src/instrumentation.ts`).
4. Verify `/api/health`.

## Android APK

Use the **Build Android APK** GitHub workflow or `APP_URL="https://your-app" bash android/build.sh`.
Keep `android/sonara.keystore` private and backed up — updates must be signed with the same key.

## Google login on Android

Google refuses OAuth inside WebViews. The wrapper opens the login in the system browser and the server
hands the session back through the `sonara://auth?t=…` deep link (`/api/auth/claim`).
Add `https://YOUR-DOMAIN/api/auth/google/callback` as the authorized redirect URI.

## Testing checklist

- Play a pop chart song → full length (check duration + timeline)
- Like / unlike, add to playlist (Apple, Audius and YouTube results)
- Close and reopen the APK → likes/playlists still there
- Google login (web + APK), YouTube playlists in Library
- Seek, next/prev, repeat, shuffle on YouTube-backed tracks
