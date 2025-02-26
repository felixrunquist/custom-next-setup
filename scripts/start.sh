#! /bin/sh
pm2 start "node scripts/advertise-mdns.js" --name "mdns"
pm2 start "node scripts/halistener.js" --name "mdns"