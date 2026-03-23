#!/bin/bash
# Deeprun - GNOME Extensions Build Script
# Builds and installs extensions into the system image

set -eoux pipefail

EXTENSIONS_DIR="/usr/share/gnome-shell/extensions"
SCHEMAS_DIR="/usr/share/glib-2.0/schemas"

echo "═══════════════════════════════════════════════════"
echo "  Deeprun - Building GNOME Extensions"
echo "═══════════════════════════════════════════════════"

# Install build dependencies
dnf5 -y install glib2-devel

# ============================================
# 1. PaperWM
# ============================================
echo ""
echo "📦 Installing PaperWM..."

git clone --depth 1 https://github.com/paperwm/PaperWM /tmp/paperwm
mkdir -p "$EXTENSIONS_DIR/paperwm@paperwm.github.com"
cp -r /tmp/paperwm/* "$EXTENSIONS_DIR/paperwm@paperwm.github.com/"

if [ -d "$EXTENSIONS_DIR/paperwm@paperwm.github.com/schemas" ]; then
    glib-compile-schemas "$EXTENSIONS_DIR/paperwm@paperwm.github.com/schemas/"
    cp "$EXTENSIONS_DIR/paperwm@paperwm.github.com/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
fi
echo "✓ PaperWM installed"

# ============================================
# 2. tailscale-qs
# ============================================
echo ""
echo "📦 Installing tailscale-qs..."

git clone --depth 1 https://github.com/tailscale-qs/tailscale-gnome-qs /tmp/tailscale-qs

# Determine extension UUID from metadata
TAILSCALE_UUID=$(python3 -c "import json; print(json.load(open('/tmp/tailscale-qs/metadata.json'))['uuid'])")
mkdir -p "$EXTENSIONS_DIR/$TAILSCALE_UUID"
cp -r /tmp/tailscale-qs/* "$EXTENSIONS_DIR/$TAILSCALE_UUID/"

if [ -d "$EXTENSIONS_DIR/$TAILSCALE_UUID/schemas" ]; then
    glib-compile-schemas "$EXTENSIONS_DIR/$TAILSCALE_UUID/schemas/"
    cp "$EXTENSIONS_DIR/$TAILSCALE_UUID/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
fi
echo "✓ tailscale-qs installed as $TAILSCALE_UUID"

# ============================================
# 3. audio-switcher@jvzr (custom)
# ============================================
echo ""
echo "📦 Installing audio-switcher@jvzr..."

cp -r /tmp/extensions/audio-switcher@jvzr "$EXTENSIONS_DIR/"

if [ -d "$EXTENSIONS_DIR/audio-switcher@jvzr/schemas" ]; then
    glib-compile-schemas "$EXTENSIONS_DIR/audio-switcher@jvzr/schemas/"
    cp "$EXTENSIONS_DIR/audio-switcher@jvzr/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
fi
echo "✓ audio-switcher@jvzr installed"

# ============================================
# GSettings override: enable extensions by default
# ============================================
echo ""
echo "⚙️  Creating GSettings override..."

cat > "$SCHEMAS_DIR/zz-deeprun.gschema.override" <<EOF
[org.gnome.shell]
enabled-extensions=['paperwm@paperwm.github.com', '$TAILSCALE_UUID', 'audio-switcher@jvzr']
EOF

# Compile all schemas
glib-compile-schemas "$SCHEMAS_DIR/"
echo "✓ GSettings schemas compiled"

# ============================================
# Cleanup
# ============================================
echo ""
echo "🧹 Cleaning up build deps..."

dnf5 -y remove glib2-devel
rm -rf /tmp/paperwm /tmp/tailscale-qs /tmp/extensions

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ GNOME Extensions - Build Complete"
echo "═══════════════════════════════════════════════════"
