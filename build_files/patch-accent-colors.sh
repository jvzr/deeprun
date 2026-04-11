#!/usr/bin/env bash
# Patch Deeprun custom accent colors into:
# - adw-gtk3 theme CSS files (GTK3/4 themed apps)
# - libadwaita-1.so (native GTK4/libadwaita apps + GNOME Shell)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/accent-colors.conf"

# Build old→new mapping from the conf file
declare -A COLORS
for name in blue teal green yellow orange red pink purple slate; do
  old_var="ORIGINAL_${name}"
  new_var="ACCENT_${name}"
  COLORS["${!old_var}"]="${!new_var}"
done

# --- Patch CSS files ---

CSS_FILES=(
  /usr/share/themes/adw-gtk3/gtk-3.0/gtk.css
  /usr/share/themes/adw-gtk3/gtk-3.0/gtk-dark.css
  /usr/share/themes/adw-gtk3/gtk-4.0/libadwaita-tweaks.css
  /usr/share/themes/adw-gtk3/gtk-4.0/libadwaita.css
  /usr/share/themes/adw-gtk3-dark/gtk-3.0/gtk.css
  /usr/share/themes/adw-gtk3-dark/gtk-3.0/gtk-dark.css
  /usr/share/themes/adw-gtk3-dark/gtk-4.0/libadwaita-tweaks.css
  /usr/share/themes/adw-gtk3-dark/gtk-4.0/libadwaita.css
)

for file in "${CSS_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    for old in "${!COLORS[@]}"; do
      sed -i "s/${old}/${COLORS[$old]}/gi" "$file"
    done
    echo "Patched CSS: $file"
  else
    echo "Skipped (not found): $file"
  fi
done

# --- Patch binaries (use perl for binary-safe replacement) ---

BINARIES=(
  /usr/lib64/libadwaita-1.so.0          # GTK4/libadwaita native apps
  /usr/lib64/gnome-shell/libst-17.so    # GNOME Shell (St toolkit)
)

for bin in "${BINARIES[@]}"; do
  if [[ -f "$bin" ]]; then
    for old in "${!COLORS[@]}"; do
      new="${COLORS[$old]}"
      perl -pi -0777 -e "s/\Q${old}\E/${new}/g" "$bin"
    done
    echo "Patched binary: $bin"
  else
    echo "Skipped (not found): $bin"
  fi
done
