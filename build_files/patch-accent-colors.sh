#!/usr/bin/env bash
# Patch Deeprun custom accent colors into:
# - adw-gtk3 theme CSS files (GTK3/4 themed apps)
# - libadwaita-1.so (native GTK4/libadwaita apps + GNOME Shell)

set -euo pipefail

declare -A COLORS=(
  ["#3584e4"]="#4f82da"   # blue
  ["#2190a4"]="#34956d"   # teal
  ["#3a944a"]="#6e8b2d"   # green
  ["#c88800"]="#ce8400"   # yellow
  ["#ed5b00"]="#e7611f"   # orange
  ["#e62d42"]="#e92c1e"   # red
  ["#d56199"]="#f93379"   # pink
  ["#9141ac"]="#6140ef"   # purple
  ["#6f8396"]="#827f84"   # slate
)

# --- Patch CSS files ---

CSS_FILES=(
  /usr/share/themes/adw-gtk3/gtk-4.0/libadwaita-tweaks.css
  /usr/share/themes/adw-gtk3/gtk-4.0/libadwaita.css
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

# --- Patch libadwaita binary ---

LIBADWAITA=$(find /usr/lib64 -name 'libadwaita-1.so.0' -type f 2>/dev/null | head -1)

if [[ -n "$LIBADWAITA" ]]; then
  for old in "${!COLORS[@]}"; do
    new="${COLORS[$old]}"
    sed -i "s/${old}/${new}/g" "$LIBADWAITA"
  done
  echo "Patched binary: $LIBADWAITA"
else
  echo "Warning: libadwaita-1.so.0 not found"
fi
