#!/usr/bin/env bash
set -x
set -eo pipefail

##
## https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
##

# Create and deploy a new Worker
npm create cloudflare@latest hono-newsletter -- --type=hello-world

# Create a new version of the Worker
npx wrangler versions upload

# Create a new deployment that splits traffic between two versions of the Worker
npx wrangler versions deploy

# Set your new version to 100% deployment when you're ready
# run the same command as above but change the weight to 100
