#!/bin/bash
# =============================================================================
# Let's Encrypt SSL Certificate Initialization for ComSpace
# =============================================================================
# Usage: sudo ./scripts/init-letsencrypt.sh
#
# Prerequisites:
#   - Docker and docker-compose installed
#   - Domain DNS pointing to this server
#   - Ports 80 and 443 open
#
# This script:
#   1. Creates initial dummy certificates so nginx can start
#   2. Starts nginx container
#   3. Requests real Let's Encrypt certificates via certbot
#   4. Reloads nginx with real certificates
# =============================================================================

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
# Change these to match your production domain(s)
DOMAINS="${SSL_DOMAINS:-comspace.example.com api.comspace.example.com}"
EMAIL="${SSL_EMAIL:-admin@comspace.example.com}"  # Let's Encrypt notification email
STAGING="${SSL_STAGING:-0}"  # Set to 1 to use staging (rate limit free) for testing

# ── Paths ──────────────────────────────────────────────────────────────────────
DATA_PATH="./nginx/ssl/certbot"
COMPOSE_FILE="docker-compose.prod.yml"
RSA_KEY_SIZE=4096

echo "=== ComSpace SSL Certificate Setup ==="
echo "Domains: ${DOMAINS}"
echo "Email:   ${EMAIL}"
echo "Staging: ${STAGING}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
  echo "ERROR: Run with sudo or add your user to the docker group."
  exit 1
fi

# 1. Create required directories
echo ">>> Creating certificate directories..."
mkdir -p "$DATA_PATH/conf/live"
mkdir -p "$DATA_PATH/www"

# 2. Generate dummy certificates so nginx can start
FIRST_DOMAIN=$(echo "$DOMAINS" | awk '{print $1}')
CERT_DIR="$DATA_PATH/conf/live/$FIRST_DOMAIN"

if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo ">>> Generating dummy certificate for initial nginx startup..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null

  # Copy to nginx/ssl for the nginx container to find
  cp "$CERT_DIR/fullchain.pem" ./nginx/ssl/fullchain.pem
  cp "$CERT_DIR/privkey.pem" ./nginx/ssl/privkey.pem
fi

# 3. Start nginx (and dependencies)
echo ">>> Starting nginx..."
docker compose -f "$COMPOSE_FILE" up -d nginx

# Wait for nginx to be ready
sleep 5

# 4. Delete dummy certificates
echo ">>> Removing dummy certificates..."
rm -rf "$CERT_DIR"

# 5. Request real certificates from Let's Encrypt
echo ">>> Requesting Let's Encrypt certificates..."

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
fi

DOMAIN_ARGS=""
for domain in $DOMAINS; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

docker run --rm \
  -v "$DATA_PATH/conf:/etc/letsencrypt" \
  -v "$DATA_PATH/www:/var/www/certbot" \
  --network host \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $STAGING_ARG \
    $DOMAIN_ARGS

# 6. Copy real certificates to nginx/ssl
echo ">>> Installing certificates..."
cp "$CERT_DIR/fullchain.pem" ./nginx/ssl/fullchain.pem
cp "$CERT_DIR/privkey.pem" ./nginx/ssl/privkey.pem

# 7. Reload nginx
echo ">>> Reloading nginx with real certificates..."
docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

echo ""
echo "=== SSL setup complete! ==="
echo ""
echo "To auto-renew, add this cron job (runs twice daily):"
echo "  0 0,12 * * * cd $(pwd) && docker run --rm -v $(pwd)/$DATA_PATH/conf:/etc/letsencrypt -v $(pwd)/$DATA_PATH/www:/var/www/certbot certbot/certbot renew --quiet && cp $(pwd)/$CERT_DIR/fullchain.pem $(pwd)/nginx/ssl/fullchain.pem && cp $(pwd)/$CERT_DIR/privkey.pem $(pwd)/nginx/ssl/privkey.pem && docker compose -f $COMPOSE_FILE exec nginx nginx -s reload"
