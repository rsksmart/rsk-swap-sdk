#!/bin/bash
echo "Syncing with -> $1"

npx swagger-typescript-api --path $1/api-json \
    --modular --add-readonly true --no-client \
    --route-types --output src/api/bindings \
    --templates src/api/templates;