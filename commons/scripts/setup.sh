#!/bin/bash
set -e
cd $HOME

echo "=========================================="
echo "= CIT2008 - Group Site Setup"
echo "=========================================="

# == System dependencies ================
echo "== Installing system dependencies..."
echo "- Installing curl, git, ufw, nginx, certbot, python3-certbot-nginx"
sudo apt update >/dev/null 2>&1 && sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx >/dev/null 2>&1
echo "- Installing Node.js"
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - >/dev/null 2>&1
    sudo apt install -y nodejs build-essential >/dev/null 2>&1
else
    echo "  - Node.js is already installed"
fi
echo "- Installing PM2"
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2 >/dev/null 2>&1
fi

# == Configuration ======================
echo "== Looking for group folder"
FOLDERS=$(find . -maxdepth 1 -type d -name "S[0-9][0-9]G[0-9][0-9]")
if [ -z "$FOLDERS" ]; then
  echo "- Error: No elegible folders found."
  exit 1
fi
FOLDER_COUNT=$(echo "$FOLDERS" | wc -l)
if [ "$FOLDER_COUNT" -gt 1 ]; then
    echo "- Error: There are multiple elegible folders:"
    echo "  - $FOLDERS"
    exit 1
fi
FOLDER=$(echo "$FOLDERS" | head -n 1)
echo "- Using folder: $FOLDER"
cd "$FOLDER"
echo "- Setting variables for setup"
DOMAIN="$(basename "$FOLDER" | tr '[:upper:]' '[:lower:]').www.exampledomain.cloud"
echo "- Calculated domain: $DOMAIN"
echo "- Injecting DOMAIN into commons/configs/site.config.js"
if [ -f "commons/configs/site.config.js" ]; then
    echo "- Updating site.config.js with DOMAIN"
    if grep -q "DOMAIN:" commons/configs/site.config.js; then
        # Update existing DOMAIN key
        sed -i "s/DOMAIN: *['\"][^'\"]*['\"]/DOMAIN: '$DOMAIN'/" commons/configs/site.config.js
    else
        # Insert DOMAIN key after the opening of the config object
        sed -i "/module.exports *= *{/a\    DOMAIN: '$DOMAIN'," commons/configs/site.config.js
    fi
else
    echo "- Warning: commons/configs/site.config.js not found, skipping DOMAIN injection."
fi

# == Installing project dependencies ====
echo "== Installing project dependencies"
npm install >/dev/null 2>&1
echo "- Running npm install"

# == Nginx configuration ================
echo "== Setting up Nginx configuration"
echo "- Calculated domain: $DOMAIN"
echo "- Creating Nginx config"
sed "s|{{DOMAIN}}|$DOMAIN|g" commons/configs/nginx.template | sudo tee /etc/nginx/sites-available/www-group >/dev/null
echo "- Enabling Nginx config"
sudo ln -sf /etc/nginx/sites-available/www-group /etc/nginx/sites-enabled/www-group
echo "- Testing and reloading Nginx"
sudo nginx -t >/dev/null 2>&1
echo "- Reloading Nginx"
sudo systemctl reload nginx >/dev/null 2>&1

# == Installing SSL certificate =========
echo "== Installing SSL certificate with Certbot"
echo "- Allowing HTTPS through firewall"
sudo ufw allow 'Nginx Full' >/dev/null 2>&1
echo "- Obtaining SSL certificate from Let's Encrypt"
sudo certbot --nginx -d "$DOMAIN" --agree-tos --non-interactive --email admin@$DOMAIN >/dev/null 2>&1

# == Start server with PM2 ==============
echo "== Configuring backend server with PM2"
echo "- Checking for existing PM2 process 'www-group'"
if pm2 list | grep -q 'www-group'; then
    echo "  - Stopping existing PM2 process 'www-group'"
    pm2 stop www-group >/dev/null 2>&1
    echo "  - Deleting existing PM2 process 'www-group'"
    pm2 delete www-group >/dev/null 2>&1
fi
echo "- Starting backend/server.js with PM2"
pm2 start commons/configs/pm2.config.js --only www-group >/dev/null 2>&1
echo "- Setting up PM2 to start on boot"
sudo $(pm2 startup systemd -u $USER --hp $HOME | tail -1) >/dev/null 2>&1
echo "- Saving PM2 process list"
pm2 save >/dev/null 2>&1

# == Final message ======================
echo "=========================================="
echo "== ~/$(basename $FOLDER) ready!"
