#!/usr/bin/env bash
# Patch Deeprun custom accent colors into:
# - adw-gtk3 theme CSS files (GTK3/4 themed apps)
# - libadwaita-1.so (native GTK4/libadwaita apps + GNOME Shell)

set -euo pipefail

declare -A COLORS=(
  ["#3584e4"]="#5181de"   # blue
  ["#2190a4"]="#0091b3"   # teal
  ["#3a944a"]="#339542"   # green
  ["#c88800"]="#d5a730"   # yellow (logo gold)
  ["#ed5b00"]="#ef5800"   # orange
  ["#e62d42"]="#ea271a"   # red
  ["#d56199"]="#ec4f6a"   # pink
  ["#9141ac"]="#644bdb"   # purple
  ["#6f8396"]="#847c94"   # slate
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
