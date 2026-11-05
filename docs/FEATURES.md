# Feature Matrix

## Working now

Core player, queue remove/reorder engine, mini/full player, lock-screen controls, headset media actions, shuffle/repeat, seek, mute/volume, lyrics, album/artist pages, favorites, playlists, sorting, history, unified search, genre discovery, offline downloads, charts, country charts, mood radio, FM/internet radio, podcasts, daily mix, similar songs, 10 themes, custom accent/UI controls, AMOLED, dynamic artwork color, EQ presets/manual bands, bass boost preset, speed, crossfade, gapless, normalization, sleep timer, visualizer, voice search, stats, sharing, profile, listening goals, service-worker recovery, foreground Android playback and storage manager.

## Requires external service/account/SDK before it can be real

- Full Spotify/Apple/YouTube copyrighted streams: commercial licenses and OAuth.
- Neural fingerprint identification: licensed fingerprint database/model.
- Voice-biometric authentication: enrollment model and secure identity backend.
- Friend graph, public profiles, comments, leaderboards, gifts, group rooms and collaborative editing: authenticated multi-user backend and moderation.
- Chromecast/AirPlay/Android Auto/CarPlay/watch apps: platform SDKs, developer accounts and certification.
- Federated learning, multi-region sync, autoscaling and canary traffic: deployed cloud infrastructure.
- Calendar, health and location automation: explicit OS permissions and native integrations.
- Vocal removal/mashup generation: downloadable ML models and significantly larger APK.

These are intentionally not represented as fake toggles. The architecture has provider, feature-flag and route boundaries for future integrations.
