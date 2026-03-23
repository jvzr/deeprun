#!/bin/bash
# Deeprun - GNOME Extensions Install Script

set -eoux pipefail

EXTENSIONS_DIR="/usr/share/gnome-shell/extensions"
SCHEMAS_DIR="/usr/share/glib-2.0/schemas"
GNOME_VERSION=$(gnome-shell --version | grep -oP '\d+')

echo "═══════════════════════════════════════════════════"
echo "  Deeprun - Installing GNOME Extensions (GNOME $GNOME_VERSION)"
echo "═══════════════════════════════════════════════════"

# Install from extensions.gnome.org by ID
install_ego() {
    local PK=$1
    local URL="https://extensions.gnome.org/extension-info/?pk=${PK}&shell_version=${GNOME_VERSION}"
    local INFO=$(curl -fsSL "$URL")
    local UUID=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['uuid'])")
    local DL=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['download_url'])")

    echo "📦 Installing $UUID..."
    mkdir -p "$EXTENSIONS_DIR/$UUID"
    curl -fsSL "https://extensions.gnome.org${DL}" -o /tmp/ext.zip
    unzip -qo /tmp/ext.zip -d "$EXTENSIONS_DIR/$UUID"
    rm /tmp/ext.zip
    cp "$EXTENSIONS_DIR/$UUID/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
    echo "✓ $UUID"
}

# 1. PaperWM (GitHub — too large/complex for EGO zip)
echo "📦 Installing PaperWM..."
git clone --depth 1 https://github.com/paperwm/PaperWM "$EXTENSIONS_DIR/paperwm@paperwm.github.com"
rm -rf "$EXTENSIONS_DIR/paperwm@paperwm.github.com/.git"
cp "$EXTENSIONS_DIR/paperwm@paperwm.github.com/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
echo "✓ PaperWM"

# 2. tailscale-qs (EGO #9193)
install_ego 9193

# 3. audio-switcher@jvzr (custom)
echo "📦 Installing audio-switcher@jvzr..."
cp -r /tmp/extensions/audio-switcher@jvzr "$EXTENSIONS_DIR/"
cp "$EXTENSIONS_DIR/audio-switcher@jvzr/schemas/"*.gschema.xml "$SCHEMAS_DIR/" 2>/dev/null || true
echo "✓ audio-switcher@jvzr"

# Enable all by default
cat > "$SCHEMAS_DIR/zz-deeprun.gschema.override" <<'EOF'
[org.gnome.shell]
enabled-extensions=['paperwm@paperwm.github.com', 'tailscale-gnome-qs@tailscale-qs.github.io', 'audio-switcher@jvzr']
EOF

glib-compile-schemas "$SCHEMAS_DIR/"
rm -rf /tmp/extensions

echo "✅ GNOME Extensions done"
