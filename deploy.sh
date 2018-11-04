#/bin/bash
pm2 start pm2.yml
pm2 save
ln -sf  $(pwd)/nginx-discovery /etc/nginx/sites-enabled/nginx-discovery
nginx -s reload