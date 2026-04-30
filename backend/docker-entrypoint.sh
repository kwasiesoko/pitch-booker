#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting Pitch Booker backend..."
exec node dist/src/main.js
