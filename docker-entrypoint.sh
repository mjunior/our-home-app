#!/bin/sh
set -eu

read_secret_file() {
  var_name="$1"
  file_var_name="${var_name}_FILE"
  eval file_path="\${$file_var_name:-}"
  if [ -n "${file_path}" ] && [ -f "${file_path}" ]; then
    value="$(cat "${file_path}")"
    export "${var_name}=${value}"
  fi
}

read_secret_file "DATABASE_URL"
read_secret_file "POSTGRES_PASSWORD"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${POSTGRES_HOST:-}" ] && [ -n "${POSTGRES_DB:-}" ] && [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
    ENCODED_PASSWORD="$(node -p 'encodeURIComponent(process.argv[1])' "${POSTGRES_PASSWORD}")"
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${ENCODED_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}?sslmode=${POSTGRES_SSLMODE:-disable}"
    echo "DATABASE_URL assembled from POSTGRES_* variables."
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql://postgres:our%40home%40db%401020@instrutor-autonomo_ourhomedb:5432/instrutor-autonomo?sslmode=disable"
  echo "DATABASE_URL not provided; using built-in fallback value."
fi

echo "Running Prisma schema sync..."
echo "Generating Prisma client..."
npx prisma generate --schema prisma/schema.prisma

echo "Applying Prisma schema to database..."
npx prisma db push --schema prisma/schema.prisma

echo "Starting application..."
exec npm run preview -- --host 0.0.0.0 --port "${PORT:-4173}"
