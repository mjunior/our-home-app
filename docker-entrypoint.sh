#!/bin/sh
set -eu

echo "Running Prisma schema sync..."
echo "Generating Prisma client..."
npx prisma generate --schema prisma/schema.prisma

echo "Applying Prisma schema to database..."
npx prisma db push --schema prisma/schema.prisma

echo "Starting application..."
exec npm run preview -- --host 0.0.0.0 --port "${PORT:-4173}"
