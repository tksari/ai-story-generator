#!/bin/bash

echo "Seeding the database..."
npm run prisma:seed $1 || exit 1

echo "All done successfully!"
