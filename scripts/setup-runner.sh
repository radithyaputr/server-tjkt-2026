#!/bin/bash
set -euo pipefail

# ===============================================
#  Self-Hosted GitHub Actions Runner Setup
#  untuk server-tjkt-2026
# ===============================================
# Cara pakai:
#   1. SSH ke server: ssh user@<tailscale-ip>
#   2. Copy & paste script ini di terminal server
#   3. Ikuti petunjuk di layar
# ===============================================

REPO="radithyaputr/server-tjkt-2026"
RUNNER_DIR="$HOME/actions-runner"

echo "============================================"
echo "  GitHub Self-Hosted Runner Setup"
echo "  Repo: $REPO"
echo "============================================"
echo ""

# Prerequisite check
echo "[1/6] Checking prerequisites..."
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl not found. Install it first."; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "ERROR: tar not found."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker not found."; exit 1; }
echo "  -> All prerequisites met."
echo ""

# Create runner directory
echo "[2/6] Creating runner directory at $RUNNER_DIR..."
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
echo "  -> Directory ready."
echo ""

# Download latest runner
echo "[3/6] Downloading latest GitHub Actions runner..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep '"tag_name"' | sed 's/.*"v\(.*\)".*/\1/')
echo "  -> Latest version: v$LATEST_VERSION"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${LATEST_VERSION}/actions-runner-linux-x64-${LATEST_VERSION}.tar.gz"
curl -o "actions-runner.tar.gz" -L "$RUNNER_URL"
tar xzf "actions-runner.tar.gz"
rm -f "actions-runner.tar.gz"
echo "  -> Runner downloaded & extracted."
echo ""

# Configure
echo "[4/6] Configuring runner..."
echo ""
echo "  >>> PERHATIAN! <<<"
echo "  Kamu perlu token dari GitHub:"
echo "  1. Buka https://github.com/$REPO/settings/actions/runners"
echo "  2. Klik 'New self-hosted runner'"
echo "  3. Copy token di bagian 'Configure'"
echo ""
read -rp "  Paste token GitHub di sini: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "ERROR: Token cannot be empty."
  exit 1
fi

./config.sh --url "https://github.com/$REPO" --token "$TOKEN" --labels "self-hosted" --unattended
echo "  -> Runner configured successfully!"
echo ""

# Install as service
echo "[5/6] Installing runner as system service..."
sudo ./svc.sh install
sudo ./svc.sh start
echo "  -> Runner service installed & started."
echo ""

# Verify
echo "[6/6] Verifying runner is running..."
sleep 2
if ./svc.sh status | grep -q "active (running)"; then
  echo "  -> SUCCESS! Runner is running!"
else
  echo "  -> WARNING: Runner may not be running. Check with: cd $RUNNER_DIR && sudo ./svc.sh status"
fi

echo ""
echo "============================================"
echo "  SETUP COMPLETE!"
echo ""
echo "  Sekarang setiap kamu git push ke main,"
echo "  server akan otomatis deploy!"
echo ""
echo "  Cek status runner kapan aja:"
echo "    cd $RUNNER_DIR && sudo ./svc.sh status"
echo ""
echo "  Lihat log runner:"
echo "    cd $RUNNER_DIR && sudo ./svc.sh log"
echo ""
echo "  Hentikan runner:"
echo "    cd $RUNNER_DIR && sudo ./svc.sh stop"
echo "============================================"
