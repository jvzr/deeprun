#!/usr/bin/env bash
# Remove dead keys from the qwerty-fr XKB layout.
# All French accented characters are already available as direct keys,
# so dead keys are unnecessary and cause ghost key behavior under ibus/GNOME.

set -euo pipefail

XKB_FILES=(
  /usr/share/X11/xkb/symbols/us
  /usr/share/X11/xkb/symbols/us_qwerty-fr
)

for XKB_FILE in "${XKB_FILES[@]}"; do
  if [[ ! -f "$XKB_FILE" ]]; then
    echo "Skipped (not found): $XKB_FILE"
    continue
  fi

  sed -i '
    s/dead_grave/grave/g
    s/dead_tilde/asciitilde/g
    s/dead_doubleacute/VoidSymbol/g
    s/dead_currency/VoidSymbol/g
    s/dead_macron/VoidSymbol/g
    s/dead_abovedot/VoidSymbol/g
    s/dead_circumflex/asciicircum/g
    s/dead_caron/VoidSymbol/g
    s/dead_invertedbreve/VoidSymbol/g
    s/dead_breve/VoidSymbol/g
    s/dead_greek/VoidSymbol/g
    s/dead_acute/acute/g
    s/dead_abovering/VoidSymbol/g
    s/dead_diaeresis/diaeresis/g
    s/dead_cedilla/cedilla/g
    s/dead_ogonek/VoidSymbol/g
  ' "$XKB_FILE"

  echo "Patched: $XKB_FILE"
done
