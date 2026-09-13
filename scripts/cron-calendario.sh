#!/bin/sh
# Cada 10 min: fuerza la sincronización iCal con Airbnb (ver CALENDARIO.md).
# Va directo al puerto local para no pegarle al caché de Cloudflare.
. /etc/margarita-renace/calendario.env
curl -s -m 60 -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $CALENDARIO_SECRETO" -H "Host: margaritarenace.com.ve" http://127.0.0.1:3002/api/calendario/sync
