#!/usr/bin/env bash
FILE="file://$PWD/index.html"
xdg-open "$FILE" || gio open "$FILE" || x-www-browser "$FILE"
