#!/bin/sh
set -eu

echo "Running Prisma schema sync..."
npx prisma db push --schema prisma/schema.prisma

echo "Starting application..."
exec npm run preview -- --host 0.0.0.0 --port "${PORT:-4173}"
