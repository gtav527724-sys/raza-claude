# SONARA API

All responses are JSON unless the route streams audio. Client requests time out after 12 seconds. External-provider routes are rate-limited per IP.

## Catalog

- `GET /api/home` — featured album, albums, quick picks, history.
- `GET /api/tracks?q=` — local catalog search.
- `GET /api/audius?q=` — full-stream Audius search.
- `GET /api/itunes?q=` — Apple catalog previews.
- `GET /api/deezer?q=` — Deezer catalog previews.
- `GET /api/catalog-search?q=` — MusicBrainz global metadata.
- `GET /api/charts` — global charts.
- `GET /api/country-charts?country=pk` — country Top 50.
- `GET /api/artist?name=` — merged artist discography.
- `GET /api/similar?artist=&genre=&title=` — similar-song queue.
- `GET /api/dailymix` — daily personalized mix.
- `GET /api/radio?mood=` — mood station.
- `GET /api/stations?q=` — internet radio directory.
- `GET /api/podcasts?q=` — podcast episodes.
- `GET /api/lyrics?artist=&title=` — lyrics.

## Playback

- `GET /api/stream?url=` — allowlisted same-origin audio relay. Preserves Range headers and returns `206` for seeking.

## Library

- `GET/POST/DELETE /api/liked`
- `GET/POST /api/playlists`
- `GET/DELETE /api/playlists/:id`
- `POST/DELETE /api/playlists/:id/tracks`
- `GET/POST/DELETE /api/history`
- `GET/POST/DELETE /api/searches`
- `POST /api/sync-track` — persists an internet result before library operations.
- `GET /api/library`, `/api/stats`, `/api/insights`

## Mutation security

Mutation calls must be same-origin or include `X-Sonara-Client: app`. JSON payloads are size-limited and validated with Zod. Cross-origin form submissions receive HTTP 403.

## Health

- `GET /api/health` — runtime/database health probe.
