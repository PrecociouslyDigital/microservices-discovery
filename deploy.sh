#/bin/bash
pm2 start pm2.yml
pm2 save
sudo ln -sf  $(pwd)/nginx-discovery /etc/nginx/sites-enabled/nginx-discovery
sudo nginx -s reload