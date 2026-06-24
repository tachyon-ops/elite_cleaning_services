#!/bin/bash
# Local helper script to trigger zero-downtime redeployment on the production server (nuuno.art)
# Usage: ./deploy.sh

set -e

DOMAIN="mondar.ch"
PM2_DOMAIN="mondar.eu" # The root application runs under the mondar.eu Hestia folder
PORT="3003"
REPO_DIR="/home/admin/web/mondar.eu/private/elite_cleaning_services"

# Detect if there are uncommitted changes or unpushed commits
UNCOMMITTED=$(git status --porcelain)
UNPUSHED=$(git cherry -v 2>/dev/null)

if [ -n "$UNCOMMITTED" ] || [ -n "$UNPUSHED" ]; then
    if [ -n "$UNCOMMITTED" ]; then
        echo "Uncommitted local modifications detected."
    fi
    if [ -n "$UNPUSHED" ]; then
        echo "Unpushed commits detected (your local branch is ahead of origin/master)."
        echo "Since the remote server pulls directly from GitHub, these commits must be pushed first."
    fi
    read -p "Do you want to push your local commits to origin master now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        if [ -n "$UNCOMMITTED" ]; then
            echo "Note: You have uncommitted changes. Only committed changes will be pushed."
        fi
        if [ -n "$UNPUSHED" ]; then
            echo "Pushing local commits to origin master..."
            git push origin master
        fi
    fi
else
    echo "Working directory is clean and up-to-date with remote."
fi

echo "=========================================================="
echo "Triggering remote zero-downtime redeployment on nuuno.art..."
echo "=========================================================="

# Run the redeployment on the server as the admin user using SSH agent forwarding
ssh -A root@nuuno.art "
    chmod 777 \$SSH_AUTH_SOCK && \
    chmod 755 \$(dirname \$SSH_AUTH_SOCK) && \
    sudo SSH_AUTH_SOCK=\$SSH_AUTH_SOCK -u admin GIT_SSH_COMMAND=\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o IdentityFile=/dev/null\" git -C $REPO_DIR fetch && \
    sudo SSH_AUTH_SOCK=\$SSH_AUTH_SOCK -u admin git -C $REPO_DIR reset --hard origin/master && \
    sudo runuser -l admin -c 'export NODE_OPTIONS=\"--max-old-space-size=1536\" && /home/admin/deploy-app.sh --domain $PM2_DOMAIN --port $PORT --app-dir $REPO_DIR'
"

echo "=========================================================="
echo "✓ Zero-downtime redeployment completed successfully!"
echo "Site is live at: https://$DOMAIN"
echo "=========================================================="
