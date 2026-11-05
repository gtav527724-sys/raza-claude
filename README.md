# SONARA

Mobile-first music player — Next.js (App Router) + PostgreSQL/Drizzle + Web Audio + YouTube IFrame player + PWA + native Android WebView shell.

## Kya naya / fix hua (v1.1)

| Masla | Fix |
|---|---|
| Songs sirf 30 second chalte the | Apple/Deezer ke 30s previews ab **kabhi play nahi hote**. Play dabate hi `/api/resolve` full-length version dhoondta hai (Audius mp3 ya YouTube official audio) aur **poora song** chalta hai. Match na mile to hi preview fallback. |
| Like button kaam nahi karta tha | Ab ek hi request mein track save + like hota hai (`POST /api/liked`), error par auto-retry + rollback + toast. |
| Playlist mein add nahi hota tha | Audius/YouTube tracks sync na hone ki wajah se fail hota tha. Ab `POST /api/playlists/:id/tracks` track ko khud save karta hai. |
| Deploy ke baad DB errors | Tables **khud ban jaate hain** (`src/instrumentation.ts` → `src/db/ensure.ts`). `drizzle-kit push` ki zaroorat nahi. DB lazy-connect hai, build kabhi fail nahi hota. |
| Sab users ka data mix | Har device/user ka apna data (`owner`). Google login par purana data account mein merge ho jata hai. |
| Google login + YouTube songs | Google OAuth (`/api/auth/google/*`), YouTube search (no quota), user ki apni YouTube playlists/liked videos. |
| APK build errors | `android/build.sh` ab kisi bhi machine/GitHub Actions par chalti hai. Google login Android mein system browser se hota hai (WebView mein Google block karta hai). |

## Folder structure

```text
src/
  app/api/            auth, youtube, resolve, liked, playlists, library, stream ...
  components/         player UI, AccountCard, YouTubeLibrary ...
  db/                 schema.ts, ensure.ts (auto-migrate), seed-catalog.ts
  lib/                player engine, yt-engine, playable, resolve, youtube, library store
  lib/server/         session (auth), tracks (upsert), security
  instrumentation.ts  runs schema bootstrap on server start
  proxy.ts            per-device cookie
android/              WebView shell + foreground service + build.sh
.github/workflows/    ci.yml, android-apk.yml
```

## Local setup

```bash
cp .env.example .env      # DATABASE_URL set karein
npm install
npm run dev               # tables + demo catalog automatic
```

## Environment variables

| Name | Zaroori? | Kaam |
|---|---|---|
| `DATABASE_URL` | Haan | PostgreSQL (Neon/Supabase/Railway) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google login ke liye | OAuth |
| `AUTH_SECRET` | Recommended | Session signing (`openssl rand -hex 32`) |
| `APP_URL` | Recommended | Permanent public URL |

## Google login setup (5 min)

1. https://console.cloud.google.com → naya project → **APIs & Services → Library** → **YouTube Data API v3** enable karein.
2. **OAuth consent screen**: External, app name SONARA, apna email; **Test users** mein apna Gmail add karein (publish karne tak sirf test users login kar sakte hain).
3. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/google/callback`
4. Client ID/Secret ko hosting ke Environment Variables mein `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` ke naam se daalein, `AUTH_SECRET` bhi, aur redeploy karein.
5. App → Settings → **Google se login karein**.

> Note: YouTube read-only scope "sensitive" hai — verification se pehle 100 test users tak limit hoti hai. Login ke baghair bhi poori app aur YouTube search kaam karti hai.

## Deploy (Vercel + Neon)

1. Code GitHub par push karein.
2. Neon par free Postgres banayein → connection string copy.
3. Vercel → Import repo → Environment Variables (upar wali table) → Deploy.
4. `https://YOUR-APP/api/health` check karein (`{"ok":true}`). Tables pehli request par khud ban jaate hain.

## APK banana

Permanent URL chahiye (sandbox/e2b URL kaam nahi karega — wo expire ho jata hai).

**GitHub Actions (aasan):** repo → Actions → **Build Android APK** → Run workflow → app URL daalein → artifact `Sonara-apk` download karein.
Optional secret `ANDROID_KEYSTORE_B64` (`base64 -w0 android/sonara.keystore`) taake updates same signature se hon.

**Local:** JDK 17 + Android SDK (build-tools 34, platform android-34) install karein:

```bash
APP_URL="https://your-app.vercel.app" bash android/build.sh
# → android/build/sonara.apk
```

## Quality commands

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run lint
npx vitest run
npm run build
```

## Legal / limitations

- Playback YouTube ke official IFrame player se hoti hai (YouTube Terms ke mutabiq); koi DRM bypass ya download nahi.
- Kuch videos uploader ne embed block kiye hote hain — app khud next candidate try karta hai.
- YouTube songs offline download nahi ho sakte (sirf direct full-length streams ho sakte hain).
- YouTube-engine mein EQ/visualizer kaam nahi karta (cross-origin iframe); Audius/local songs par kaam karta hai.
