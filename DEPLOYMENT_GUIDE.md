# Deployment Guide: Setting Up New Subdomains & Next.js Apps

This guide outlines the streamlined process for provisioning new subdomains and deploying Next.js applications on the `rewilt.com` server.

---

## Prerequisites
1. **SSH Access**: You must be able to SSH into `rewilt.com` as the `nuno` user using your key.
2. **SSH Agent Forwarding**: Since the server pulls code from private GitHub repositories, you must run SSH with agent forwarding enabled (`ssh -A`) so the remote session can use your local GitHub keys.
3. **Port Allocation**: Choose an unused port for your Next.js application (e.g., `3004`, `3005`, etc.).
   - *Current Port Map*:
     - Port `3000`: `fintech.rewilt.com` (DateFund frontend)
     - Port `3001`: `venturecms.rewilt.com` (venturescms)
     - Port `3002`: `datefund-ws` (WebSockets)
     - Port `3003`: `cleaning.rewilt.com` (Elite Cleaning Services)
     - Port `8000`: `datefund-backend` (FastAPI backend)

---

## Step-by-Step Deployment Process

### Step 1: Provision the Subdomain in HestiaCP
You can do this either via the HestiaCP Web Panel or via SSH commands.

#### Option A: Web Panel (Recommended)
Log in to your HestiaCP instance, select the **`editor`** user, and add the new domain:
- **Domain**: `<subdomain>.rewilt.com`
- **IP Address**: `37.247.49.168`
- **Create DNS Zone**: Check this box.
- **SSL Support**: Check this box and select **Let's Encrypt SSL** + **Force SSL**.
- **Proxy Template**: Change this to **`nextjs`**.

#### Option B: SSH CLI Commands
Run the following commands as `nuno` (who has passwordless sudo):
```bash
# Connect to the server
ssh -i ~/.ssh/id_ed25519 nuno@rewilt.com

# Create web domain & assign nextjs proxy template
sudo /usr/local/hestia/bin/v-add-web-domain editor <subdomain>.rewilt.com
sudo /usr/local/hestia/bin/v-change-web-domain-proxy-tpl editor <subdomain>.rewilt.com nextjs

# Create DNS zone
sudo /usr/local/hestia/bin/v-add-dns-domain editor <subdomain>.rewilt.com 37.247.49.168

# Enable Let's Encrypt SSL & Force SSL
sudo /usr/local/hestia/bin/v-add-letsencrypt-domain editor <subdomain>.rewilt.com
sudo /usr/local/hestia/bin/v-add-web-domain-ssl-force editor <subdomain>.rewilt.com
```

---

### Step 2: Clone the Git Repository onto the Server
Since the repository is private, use **SSH Agent Forwarding** to authenticate as the `editor` user:

```bash
# 1. Connect to rewilt.com with agent forwarding enabled (-A)
ssh -A -i ~/.ssh/id_ed25519 nuno@rewilt.com

# 2. Allow the editor user to read nuno's SSH agent socket file temporarily
sudo chmod 777 $SSH_AUTH_SOCK && sudo chmod 755 $(dirname $SSH_AUTH_SOCK)

# 3. Clone the repo as the editor user into the private web directory
sudo SSH_AUTH_SOCK=$SSH_AUTH_SOCK -u editor git clone git@github.com:<org>/<repo>.git /home/editor/web/<subdomain>.rewilt.com/private/<repo_folder>
```

---

### Step 3: Configure the Port Mapping
Write the chosen port mapping configuration file. This file is read dynamically by the HestiaCP Nginx configuration:

```bash
sudo runuser -l editor -c 'echo "set \$app_port <PORT>;" > /home/editor/web/<subdomain>.rewilt.com/private/nginx_port.conf'
```
*Replace `<PORT>` with your chosen port (e.g. `3004`) and `<subdomain>` with your subdomain.*

---

### Step 4: Run the Deployment Script
Run the automated deployment script `/home/editor/deploy-app.sh`. 
Always run this script with `NODE_OPTIONS="--max-old-space-size=1536"` to limit Node's memory footprint during Next.js compilation, preventing OOM crashes.

```bash
sudo runuser -l editor -c 'export NODE_OPTIONS="--max-old-space-size=1536" && /home/editor/deploy-app.sh --domain <subdomain>.rewilt.com --port <PORT> --app-dir /home/editor/web/<subdomain>.rewilt.com/private/<repo_folder>'
```

---

### Step 5: Database Setup (If Using SQLite / Prisma)
If your application uses SQLite, the database schema needs to be pushed and seeded inside the build directory:

```bash
# 1. Push Prisma schema to SQLite
sudo runuser -l editor -c 'cd /home/editor/web/<subdomain>.rewilt.com/private/app-build && export PATH="/home/editor/.nvm/versions/node/v24.11.1/bin:$PATH" && ./node_modules/.bin/prisma db push'

# 2. Seed data (if seed.js is present)
sudo runuser -l editor -c 'cd /home/editor/web/<subdomain>.rewilt.com/private/app-build && export PATH="/home/editor/.nvm/versions/node/v24.11.1/bin:$PATH" && node prisma/seed.js'

# 3. Copy the populated SQLite file to the production directory
sudo runuser -l editor -c 'cp /home/editor/web/<subdomain>.rewilt.com/private/app-build/prisma/dev.db /home/editor/web/<subdomain>.rewilt.com/private/app/prisma/dev.db'

# 4. Restart PM2 to reload the database
sudo runuser -l editor -c 'export PATH="/home/editor/.nvm/versions/node/v24.11.1/bin:$PATH" && pm2 restart frontend-<subdomain>.rewilt.com'
```

---

## Troubleshooting & Operations

### Checking Service Logs
PM2 keeps out and error logs under the `editor` home directory:
```bash
# Check error log
sudo tail -n 50 /home/editor/.pm2/logs/frontend-<subdomain>.rewilt.com-error.log

# Check output log
sudo tail -n 50 /home/editor/.pm2/logs/frontend-<subdomain>.rewilt.com-out.log
```

### Checking PM2 Status
List all running Node applications:
```bash
sudo runuser -l editor -c 'export PATH="/home/editor/.nvm/versions/node/v24.11.1/bin:$PATH" && pm2 status'
```
