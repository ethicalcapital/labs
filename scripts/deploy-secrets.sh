#!/bin/bash
# deploy-secrets.sh - Deploy secrets from Doppler to Cloudflare Pages
# Usage: ./scripts/deploy-secrets.sh [project-name]

set -e

PROJECT_NAME=${1:-"labs"}
DOPPLER_PROJECT="rawls"
DOPPLER_CONFIG="dev"

echo "🔐 Deploying secrets from Doppler to Cloudflare Pages project: $PROJECT_NAME"
echo "📋 Using Doppler project: $DOPPLER_PROJECT, config: $DOPPLER_CONFIG"

# Core secrets for hooks integration
echo "📤 Deploying SYNC_TOKEN..."
doppler secrets get SYNC_TOKEN --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG --plain | \
    wrangler pages secret put SYNC_TOKEN --project-name $PROJECT_NAME

echo "📤 Deploying CONTENT_SYNC_TOKEN..."
doppler secrets get CONTENT_SYNC_TOKEN --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG --plain | \
    wrangler pages secret put CONTENT_SYNC_TOKEN --project-name $PROJECT_NAME

# External API keys
echo "📤 Deploying BUTTONDOWN_API_KEY..."
doppler secrets get BUTTONDOWN_API_KEY --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG --plain | \
    wrangler pages secret put BUTTONDOWN_API_KEY --project-name $PROJECT_NAME

echo "📤 Deploying LACRM_API_KEY..."
doppler secrets get LACRM_API_KEY --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG --plain | \
    wrangler pages secret put LACRM_API_KEY --project-name $PROJECT_NAME

# Optional: Workbench API token (when available)
# echo "📤 Deploying WORKBENCH_API_TOKEN..."
# doppler secrets get WORKBENCH_API_TOKEN --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG --plain | \
#     wrangler pages secret put WORKBENCH_API_TOKEN --project-name $PROJECT_NAME

echo "✅ All secrets deployed successfully to $PROJECT_NAME"
echo ""
echo "📊 To verify secrets were deployed:"
echo "   wrangler pages secret list --project-name $PROJECT_NAME"
echo ""
echo "🚀 To deploy the site with secrets:"
echo "   npm run build"
echo "   wrangler pages deploy dist --project-name $PROJECT_NAME"
echo ""
echo "🔄 To run locally with Doppler secrets:"
echo "   doppler run --project $DOPPLER_PROJECT --config $DOPPLER_CONFIG -- npm run dev"