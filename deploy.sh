#!/bin/bash
# Local helper script to trigger zero-downtime redeployment on the server
# Usage: ./deploy.sh

set -e

DOMAIN="cleaning.rewilt.com"
PORT="3003"
REPO_DIR="/home/editor/web/cleaning.rewilt.com/private/elite_cleaning_services"

echo "=========================================================="
# Prompt to push local changes
read -p "Do you want to git push local changes first? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Pushing local commits to origin master..."
    git push origin master
fi

echo "=========================================================="
echo "Triggering remote zero-downtime redeployment..."
echo "=========================================================="

# Run the redeployment script on the server as the editor user
ssh -A -i ~/.ssh/id_ed25519 nuno@rewilt.com "sudo chmod 777 \$SSH_AUTH_SOCK && sudo chmod 755 \$(dirname \$SSH_AUTH_SOCK) && sudo SSH_AUTH_SOCK=\$SSH_AUTH_SOCK -u editor /home/editor/redeploy.sh $DOMAIN $PORT $REPO_DIR"

echo "=========================================================="
echo "✓ Zero-downtime redeployment completed successfully!"
echo "Site is live at: https://$DOMAIN"
echo "=========================================================="
