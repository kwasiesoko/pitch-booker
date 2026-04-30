#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Seeding database..."
./node_modules/.bin/prisma db seed

echo "Starting Pitch Booker backend..."
exec node dist/src/main.js
