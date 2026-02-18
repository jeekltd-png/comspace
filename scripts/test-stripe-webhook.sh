#!/usr/bin/env bash
# ============================================================================
# Test Stripe Webhook — ComSpace
# ============================================================================
# Prerequisites:
#   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
#   2. Login:  stripe login
#   3. Start backend:  cd backend && pnpm dev
#
# Usage:
#   ./scripts/test-stripe-webhook.sh
# ============================================================================

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
WEBHOOK_PATH="/api/payments/webhook"
ENDPOINT="${BACKEND_URL}${WEBHOOK_PATH}"

echo "═══════════════════════════════════════════════════════"
echo " ComSpace — Stripe Webhook Tester"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo "❌ Stripe CLI not found."
  echo "   Install: https://stripe.com/docs/stripe-cli"
  echo ""
  echo "   macOS:   brew install stripe/stripe-cli/stripe"
  echo "   Windows: scoop install stripe"
  echo "   Linux:   See https://stripe.com/docs/stripe-cli#install"
  exit 1
fi

echo "✅ Stripe CLI found: $(stripe --version)"
echo ""

# Step 1 — Forward webhooks to local backend
echo "🔗 Forwarding webhooks to ${ENDPOINT}..."
echo "   Press Ctrl+C to stop."
echo ""
echo "   In a separate terminal, trigger a test event:"
echo "   stripe trigger checkout.session.completed"
echo "   stripe trigger payment_intent.succeeded"
echo "   stripe trigger payment_intent.payment_failed"
echo ""
echo "───────────────────────────────────────────────────────"

stripe listen --forward-to "${ENDPOINT}"
