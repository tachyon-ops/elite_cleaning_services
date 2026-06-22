#!/bin/bash
# Fully Automated Hestia Domain Provisioner & Next.js Deployer
# Usage: ./deploy-app.sh --domain <domain> --port <port> [--app-dir <source_directory>]

set -e

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift ;;
        --port) PORT="$2"; shift ;;
        --app-dir) APP_DIR="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ -z "$DOMAIN" ] || [ -z "$PORT" ]; then
    echo "Usage: $0 --domain <domain> --port <port> [--app-dir <source_directory>]"
    exit 1
fi

# 1. Detect Source Directory
if [ -z "$APP_DIR" ]; then
    if [ -d "./frontend" ]; then
        SRC_DIR="$(pwd)/frontend"
    else
        SRC_DIR="$(pwd)"
    fi
else
    SRC_DIR="${APP_DIR%/}"
fi

WEB_DIR="/home/editor/web/$DOMAIN"
PROD_DIR="$WEB_DIR/private/app"
BUILD_DIR="$WEB_DIR/private/app-build"
NODE_BIN="/home/editor/.nvm/versions/node/v24.11.1/bin"
export PATH="$NODE_BIN:$PATH"

echo "=== Processing Deployment: $DOMAIN ==="

# 2. Automatically Create Hestia Domain if it doesn't exist
if [ ! -d "$WEB_DIR" ]; then
    echo "Domain $DOMAIN not found in Hestia. Creating it now..."
    sudo /usr/local/hestia/bin/v-add-web-domain editor "$DOMAIN"
    
    echo "Assigning 'nextjs' proxy template to $DOMAIN..."
    sudo /usr/local/hestia/bin/v-change-web-domain-tpl editor "$DOMAIN" nextjs
fi

# 3. Ensure directories exist
mkdir -p "$WEB_DIR/private"
mkdir -p "$PROD_DIR"
mkdir -p "$BUILD_DIR"

# 4. Write dynamic port map for Nginx
echo "Writing Nginx port mapping (Port $PORT)..."
echo "set \$app_port $PORT;" > "$WEB_DIR/private/nginx_port.conf"

# 5. Sync source files to build directory (Safety: Exclude database files)
echo "Syncing source files from $SRC_DIR..."
rsync -a --delete --exclude='node_modules' --exclude='.next' --exclude='*.db' --exclude='*.db-journal' --exclude='*.db-shm' --exclude='*.db-wal' "$SRC_DIR/" "$BUILD_DIR/"

# 6. Build application
echo "Installing dependencies & building Next.js..."
if [ -d "$PROD_DIR/node_modules" ]; then
    rm -rf "$BUILD_DIR/node_modules"
    cp -al "$PROD_DIR/node_modules" "$BUILD_DIR/node_modules"
fi
cd "$BUILD_DIR"
npm install --no-audit --no-fund
NEXT_PUBLIC_API_URL=https://$DOMAIN npm run build

# 7. Swap active production build (Safety: Exclude database files from sync)
echo "Swapping build directory into production..."
if [ -d "$PROD_DIR/.next" ]; then
    mv "$PROD_DIR/.next" "$PROD_DIR/.next_old"
fi
mv "$BUILD_DIR/.next" "$PROD_DIR/.next"

if [ -d "$PROD_DIR/.next_old" ]; then
    rm -rf "$PROD_DIR/.next_old"
fi
rsync -a --exclude='node_modules' --exclude='.next' --exclude='*.db' --exclude='*.db-journal' --exclude='*.db-shm' --exclude='*.db-wal' "$BUILD_DIR/" "$PROD_DIR/"
if [ -d "$BUILD_DIR/node_modules" ]; then
    rm -rf "$PROD_DIR/node_modules"
    cp -al "$BUILD_DIR/node_modules" "$PROD_DIR/node_modules"
fi

# 8. Start/Restart PM2
PM2_NAME="frontend-$DOMAIN"
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
    echo "Restarting active PM2 process: $PM2_NAME..."
    pm2 reload "$PM2_NAME"
else
    echo "Registering new PM2 process: $PM2_NAME..."
    pm2 start npm --name "$PM2_NAME" --cwd "$PROD_DIR" -- start -- -p "$PORT"
fi

# 9. Test and Reload Nginx
echo "Testing Nginx configuration & Reloading..."
if sudo nginx -t > /dev/null 2>&1; then
    sudo systemctl reload nginx
    echo "=== Deployment Completed Successfully! ==="
    echo "Site is live at: https://$DOMAIN"
else
    echo "------------------------------------------------------------------------"
    echo "Nginx reload skipped. If you do not have passwordless sudo configured,"
    echo "please save the domain configuration once in the HestiaCP Web Panel"
    echo "to trigger an automatic Nginx reload and apply the new port mapping."
    echo "------------------------------------------------------------------------"
    echo "=== PM2 Service Started/Restarted Successfully ==="
fi
