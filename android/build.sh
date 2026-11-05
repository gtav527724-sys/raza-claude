#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# SONARA APK builder (no Gradle, pure Android SDK CLI tools)
#
# Usage:
#   APP_URL="https://your-sonara-app.com" bash android/build.sh
#
# Rebuild any time with a new (permanent) URL by changing APP_URL.
# Output: android/build/sonara.apk (signed, installable)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLCHAIN="$(cd "$ROOT/.." && pwd)/.toolchain"

# Works in 3 setups: local .toolchain, GitHub Actions / any machine with
# JAVA_HOME + ANDROID_HOME (or ANDROID_SDK_ROOT) already installed.
if [ -d "$TOOLCHAIN/android-sdk" ]; then
  SDK="$TOOLCHAIN/android-sdk"
  JDK="$(ls -d "$TOOLCHAIN"/jdk-17* 2>/dev/null | head -1)"
  [ -n "$JDK" ] && export JAVA_HOME="$JDK"
else
  SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
fi
if [ -z "${SDK:-}" ] || [ ! -d "$SDK" ]; then
  echo "ERROR: Android SDK not found. Set ANDROID_HOME (needs build-tools + platforms/android-34)." >&2
  exit 1
fi
[ -n "${JAVA_HOME:-}" ] && export PATH="$JAVA_HOME/bin:$PATH"
command -v javac >/dev/null || { echo "ERROR: JDK 17 (javac) not found. Install it or set JAVA_HOME." >&2; exit 1; }
export ANDROID_HOME="$SDK"

# newest installed build-tools and platform (>= 33)
BT="$(ls -d "$SDK"/build-tools/* 2>/dev/null | sort -V | tail -1)"
AJAR="$(ls -d "$SDK"/platforms/android-* 2>/dev/null | sort -V | tail -1)/android.jar"

APP_URL="${APP_URL:-}"
if [ -z "$APP_URL" ]; then
  echo "ERROR: APP_URL missing. Example: APP_URL=\"https://your-app.vercel.app\" bash android/build.sh" >&2
  exit 1
fi
APP_URL="${APP_URL%/}"
case "$APP_URL" in
  *e2b.app*|*localhost*) echo "WARNING: $APP_URL looks temporary — use your permanent deployed URL." >&2 ;;
esac
PKG_PATH="app/sonara/music"
OUT="$ROOT/build"

if [ ! -x "$BT/aapt2" ]; then
  echo "ERROR: Android build-tools not found at $BT" >&2
  exit 1
fi

echo "→ Building SONARA APK → $APP_URL"
rm -rf "$OUT"
mkdir -p "$OUT/obj" "$OUT/dex" "$OUT/gen"

# 1. Inject the app URL into MainActivity
sed "s|__APP_URL__|$APP_URL|g" \
  "$ROOT/app/src/java/$PKG_PATH/MainActivity.java" > "$OUT/gen/MainActivity.java"
cp "$ROOT/app/src/java/$PKG_PATH/PlaybackService.java" "$OUT/gen/PlaybackService.java"

# 2. Compile + link resources (aapt2)
"$BT/aapt2" compile --dir "$ROOT/app/res" -o "$OUT/res.zip"
"$BT/aapt2" link \
  -o "$OUT/unsigned.apk" \
  -I "$AJAR" \
  --manifest "$ROOT/app/AndroidManifest.xml" \
  --java "$OUT/gen" \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  "$OUT/res.zip"

# 3. Compile Java → class files
R_FILE=$(find "$OUT/gen" -name "R.java" | head -1)
javac -source 8 -target 8 -nowarn -encoding UTF-8 \
  -cp "$AJAR" \
  -d "$OUT/obj" \
  "$R_FILE" "$OUT/gen/MainActivity.java" "$OUT/gen/PlaybackService.java"

# 4. Dex (Dalvik bytecode)
CLASSES=$(find "$OUT/obj" -name '*.class')
"$BT/d8" --release --lib "$AJAR" $CLASSES --output "$OUT/dex"

# 5. Add classes.dex into the APK
(cd "$OUT/dex" && zip -q "$OUT/unsigned.apk" classes.dex)

# 6. Zipalign
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

# 7. Sign (create keystore once, reuse after)
KEYSTORE="$ROOT/sonara.keystore"
if [ ! -f "$KEYSTORE" ] && [ -n "${KEYSTORE_B64:-}" ]; then
  echo "$KEYSTORE_B64" | base64 -d > "$KEYSTORE"
fi
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias sonara \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass sonara123 -keypass sonara123 \
    -dname "CN=SONARA, OU=Music, O=SONARA, C=US" >/dev/null 2>&1
fi
"$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:sonara123 \
  --ks-key-alias sonara \
  --out "$OUT/sonara.apk" \
  "$OUT/aligned.apk"

# 8. Verify
"$BT/apksigner" verify --print-certs "$OUT/sonara.apk" >/dev/null 2>&1

SIZE=$(du -h "$OUT/sonara.apk" | cut -f1)
echo "✓ APK built: $OUT/sonara.apk ($SIZE)"
