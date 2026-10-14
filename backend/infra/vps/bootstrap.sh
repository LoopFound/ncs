#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# One-time setup of a fresh Ubuntu 24.04 server (DigitalOcean Droplet, Lightsail, Vultr …).
#
#   scp infra/vps/bootstrap.sh root@SERVER:
#   ssh root@SERVER 'bash bootstrap.sh "ssh-ed25519 AAAA… ncs-deploy"'
#
# Installs Docker, enables the firewall (22/80/443), automatic security updates, fail2ban,
# a swap file and log rotation, disables SSH password logins, and creates a "deploy" user
# (in the docker group, so effectively root: keep its key only in GitHub secrets) that CI
# logs in as. Safe to re-run.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_KEY="${1:?usage: bootstrap.sh \"<CI deploy public key>\"}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/ncs}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }
. /etc/os-release
export DEBIAN_FRONTEND=noninteractive

echo "==> packages"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl ufw fail2ban unattended-upgrades jq

echo "==> docker engine"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" },
  "live-restore": true
}
JSON
systemctl enable docker >/dev/null
systemctl restart docker

echo "==> swap (${SWAP_SIZE})"
if ! swapon --show | grep -q .; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo "==> firewall"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null

echo "==> ssh hardening"
cat > /etc/ssh/sshd_config.d/99-ncs-hardening.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
systemctl reload ssh

echo "==> automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades
systemctl enable --now fail2ban >/dev/null

echo "==> deploy user (${DEPLOY_USER})"
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER" >/dev/null
usermod -aG docker "$DEPLOY_USER"
home=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$home/.ssh"
touch "$home/.ssh/authorized_keys"
grep -qxF "$DEPLOY_KEY" "$home/.ssh/authorized_keys" || echo "$DEPLOY_KEY" >> "$home/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "$home/.ssh/authorized_keys"
chmod 600 "$home/.ssh/authorized_keys"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"

cat <<EOF

Server ready. Next:
  1. Put the production settings at ${APP_DIR}/.env.production (owner ${DEPLOY_USER}, chmod 600);
     start from .env.production.example in the repository.
  2. Point the domain's DNS A record at this server.
  3. Add this host key to the GitHub secret VPS_KNOWN_HOSTS:
$(ssh-keyscan -t ed25519 localhost 2>/dev/null | sed "s/^localhost/  <SERVER_IP_OR_HOST>/")
  4. Run the "Deploy to VPS" workflow (Actions tab) or push to main.
EOF
