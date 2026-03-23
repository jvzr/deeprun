# Deeprun

Custom Universal Blue image based on Fedora Silverblue with GNOME + PaperWM.

## Philosophy

**Separation of concerns:**
- **System** (this image): Immutable, packages only, versioned via ostree
- **User configs**: Mutable, managed with chezmoi in `$HOME`, persists across rebases

## What's included

### Desktop
- GNOME Shell with GDM
- PaperWM (scrollable tiling, baked into image)
- tailscale-qs (Tailscale quick settings)
- audio-switcher (custom extension)

### Terminal & Editor
- Ghostty, VS Code

### Gaming
- Steam (native RPM)

### Dev Tools
- gcc, make, cmake, pkg-config
- Node.js, Bun, Deno
- Rust, Go, Zig
- Python 3, pip
- Podman, podman-compose

### Shell & CLI
- fish + Starship prompt
- eza, bat, yt-dlp, chezmoi, gh
- slit (log viewer), doggo (DNS)
- input-remapper

### Network
- Tailscale

### Other
- Custom QWERTY-FR keyboard layout
- Custom Plymouth boot splash

## Installation

### First-time rebase

```bash
# Step 1: First rebase WITHOUT signature verification
sudo rpm-ostree rebase ostree-unverified-registry:ghcr.io/jvzr/deeprun:latest

# Reboot
systemctl reboot

# Step 2: Rebase to the SIGNED version
sudo rpm-ostree rebase ostree-image-signed:docker://ghcr.io/jvzr/deeprun:latest

# Reboot again
systemctl reboot
```

### Updates

```bash
sudo rpm-ostree upgrade
systemctl reboot
```

### Flatpaks (optional)

```bash
bash /usr/share/deeprun/flatpak-install.sh
```

## Security

Every image is cryptographically signed with cosign (Sigstore keyless via GitHub OIDC).

## Building locally

```bash
podman build -t deeprun -f Containerfile .
```

## Project structure

```
deeprun/
├── .github/workflows/build.yml    # CI/CD
├── build_files/
│   ├── build.sh                   # Package installation
│   ├── build-gnome-extensions.sh  # GNOME extensions
│   ├── watermark.png              # Plymouth boot logo
│   └── xkb-qwerty-fr-*.rpm       # Custom keyboard layout
├── config/
│   └── flatpak-install.sh         # Flatpak helper
├── extensions/
│   └── audio-switcher@jvzr/       # Custom GNOME extension
├── repos/                         # DNF repository definitions
├── Containerfile                  # Image definition
└── image.yml                      # BlueBuild config
```

## License

MIT
