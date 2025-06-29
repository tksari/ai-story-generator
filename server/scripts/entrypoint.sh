#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy || exit 1

echo "Generating Prisma Client..."
npx prisma generate

echo "Starting app..."
exec "$@"
