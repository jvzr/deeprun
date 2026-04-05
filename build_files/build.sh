#!/bin/bash
# Deeprun - Build Script
# GNOME + PaperWM custom image

set -eoux pipefail

echo "═══════════════════════════════════════════════════"
echo "  Deeprun - Build Starting"
echo "═══════════════════════════════════════════════════"

mkdir -p /var/log
BUILDLOG="/var/log/deeprun-build.log"
echo "Build started at $(date)" | tee -a $BUILDLOG

# ============================================
# PHASE 1: Remove unwanted GNOME apps
# ============================================
echo ""
echo "🗑️  Removing unwanted GNOME apps..."

dnf5 -y remove \
    gnome-software \
    ptyxis \
    gnome-classic-session \
    gnome-user-docs yelp \
    gnome-system-monitor \
    gnome-remote-desktop \
    rygel \
    || echo "⚠️  Some packages were not found"

# ============================================
# PHASE 2: Terminal & Editor
# ============================================
echo ""
echo "💻 Installing terminal and editor..."

dnf5 -y install --allowerasing \
    ghostty \
    code

# ============================================
# PHASE 3: Gaming
# ============================================
echo ""
echo "🎮 Installing gaming packages..."

dnf5 -y --setopt=install_weak_deps=False install \
    steam

# ============================================
# PHASE 4: Dev Tools & Build Essentials
# ============================================
echo ""
echo "🛠️  Installing development tools..."

dnf5 -y install \
    git \
    gcc \
    gcc-c++ \
    make \
    cmake \
    pkg-config \
    nodejs \
    npm \
    python3 \
    python3-pip \
    rust \
    cargo \
    golang \
    zig \
    podman \
    podman-compose \
    unzip

# ============================================
# PHASE 5: Shell & CLI Tools
# ============================================
echo ""
echo "🐚 Installing shell and CLI tools..."

dnf5 -y install \
    fish \
    starship \
    eza \
    bat \
    yt-dlp \
    chezmoi \
    gh \
    input-remapper

# Enable input-remapper service by default
mkdir -p /usr/lib/systemd/system-preset
echo "enable input-remapper.service" >> /usr/lib/systemd/system-preset/50-deeprun.preset

# ============================================
# PHASE 6: Network Services
# ============================================
echo ""
echo "🌐 Installing network services..."

dnf5 -y install \
    tailscale

# ============================================
# PHASE 7: Custom Keyboard Layout
# ============================================
echo ""
echo "⌨️  Installing custom keyboard layout..."

cd /tmp/build_files
rpm -ivh --nodeps --force xkb-qwerty-fr-0.7.3-2.noarch.rpm
echo "✓ Custom QWERTY-FR layout installed" | tee -a $BUILDLOG

# ============================================
# PHASE 8: Bun (via direct binary download)
# ============================================
echo ""
echo "📦 Installing bun..."

curl -fsSL https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip -o /tmp/bun.zip
unzip -q /tmp/bun.zip -d /tmp/
mv /tmp/bun-linux-x64/bun /usr/bin/
chmod +x /usr/bin/bun
rm -rf /tmp/bun.zip /tmp/bun-linux-x64

if [ -f /usr/bin/bun ]; then
    BUN_VERSION=$(bun --version)
    echo "✓ Bun $BUN_VERSION installed" | tee -a $BUILDLOG
else
    echo "⚠️  Bun installation failed" | tee -a $BUILDLOG
fi

# ============================================
# PHASE 9: Deno (via direct binary download)
# ============================================
echo ""
echo "📦 Installing deno..."

curl -fsSL https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip -o /tmp/deno.zip
unzip -q /tmp/deno.zip -d /tmp/
mv /tmp/deno /usr/bin/
chmod +x /usr/bin/deno
rm -f /tmp/deno.zip

if [ -f /usr/bin/deno ]; then
    DENO_VERSION=$(deno --version | head -1)
    echo "✓ Deno $DENO_VERSION installed" | tee -a $BUILDLOG
else
    echo "⚠️  Deno installation failed" | tee -a $BUILDLOG
fi

# ============================================
# PHASE 10: Go tools (slit, doggo)
# ============================================
echo ""
echo "📦 Installing Go tools (slit, doggo)..."

export GOPATH=/tmp/go
export GOCACHE=/tmp/go-cache
export GOBIN=/usr/bin
go install github.com/tigrawap/slit/cmd/slit@latest
go install github.com/mr-karan/doggo/cmd/doggo@latest
rm -rf /tmp/go /tmp/go-cache

if [ -f /usr/bin/slit ]; then
    echo "✓ Slit installed" | tee -a $BUILDLOG
else
    echo "⚠️  Slit installation failed" | tee -a $BUILDLOG
fi

if [ -f /usr/bin/doggo ]; then
    DOGGO_VERSION=$(doggo --version 2>/dev/null | head -1 || echo "unknown")
    echo "✓ Doggo $DOGGO_VERSION installed" | tee -a $BUILDLOG
else
    echo "⚠️  Doggo installation failed" | tee -a $BUILDLOG
fi

# ============================================
# PHASE 11: Cleanup
# ============================================
echo ""
echo "🧹 Cleaning up..."

dnf5 clean all

echo ""
echo "Build completed at $(date)" | tee -a $BUILDLOG
echo "═══════════════════════════════════════════════════"
echo "  ✅ Deeprun - Build Complete"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📊 Build Summary:"
cat $BUILDLOG
