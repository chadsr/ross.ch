#!/bin/bash
# Run with root crontab to renew certificates like so:
# renew_ssl.sh PATH_TO_COMPOSE_BIN PATH_TO_COMPOSE_YML

$1 -f $2 run certbot renew --dry-run \
&& $1 -f $2 kill -s SIGHUP webserver