ARG IMAGE_NAME="${IMAGE_NAME:-silverblue-main}"
ARG BASE_IMAGE="ghcr.io/ublue-os/${IMAGE_NAME}"
ARG FEDORA_MAJOR_VERSION="${FEDORA_MAJOR_VERSION:-43}"

FROM ${BASE_IMAGE}:${FEDORA_MAJOR_VERSION} AS deeprun

# ============================================
# Metadata
# ============================================
LABEL org.opencontainers.image.title="Deeprun"
LABEL org.opencontainers.image.description="Universal Blue GNOME image with PaperWM + custom tools"
LABEL org.opencontainers.image.source="https://github.com/jvzr/deeprun"
LABEL org.opencontainers.image.authors="jvzr"

# ============================================
# PHASE 1: Setup repositories
# ============================================
COPY repos/*.repo /etc/yum.repos.d/

RUN rpm --import https://packages.microsoft.com/keys/microsoft.asc && \
    rpm --import https://copr-be.cloud.fedoraproject.org/results/pgdev/ghostty/pubkey.gpg && \
    rpm --import https://repos.fyralabs.com/terra43/key.asc && \
    rpm --import https://copr-be.cloud.fedoraproject.org/results/atim/starship/pubkey.gpg && \
    rpm --import https://pkgs.tailscale.com/stable/fedora/repo.gpg

# ============================================
# PHASE 2: Run build script
# ============================================
COPY build_files /tmp/build_files
COPY extensions /tmp/extensions

RUN chmod +x /tmp/build_files/build.sh && \
    /tmp/build_files/build.sh && \
    ostree container commit

# ============================================
# PHASE 3: Build GNOME extensions
# ============================================
RUN chmod +x /tmp/build_files/build-gnome-extensions.sh && \
    /tmp/build_files/build-gnome-extensions.sh && \
    ostree container commit

# ============================================
# PHASE 4: Plymouth boot logo + initramfs
# ============================================
RUN cp /tmp/build_files/watermark.png /usr/share/plymouth/themes/spinner/watermark.png && \
    QUALIFIED_KERNEL=$(ls /lib/modules/ | sort -V | tail -1) && \
    /usr/bin/dracut --no-hostonly --kver "$QUALIFIED_KERNEL" --reproducible --zstd -v --add ostree -f "/lib/modules/$QUALIFIED_KERNEL/initramfs.img" && \
    ostree container commit

# ============================================
# PHASE 5: Install Flatpak helper script
# ============================================
COPY config/flatpak-install.sh /usr/share/deeprun/flatpak-install.sh
RUN chmod +x /usr/share/deeprun/flatpak-install.sh

# ============================================
# PHASE 6: Cleanup
# ============================================
RUN rm -rf /tmp/build_files /tmp/extensions

# ============================================
# Final ostree commit
# ============================================
RUN ostree container commit
