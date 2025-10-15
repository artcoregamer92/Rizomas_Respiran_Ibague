#!/usr/bin/env bash
FILE="file://$PWD/index.html"
open -a "Google Chrome" "$FILE" || open "$FILE"
