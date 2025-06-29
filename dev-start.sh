#!/bin/bash
chmod +x server/scripts/entrypoint.sh

echo "Which part do you want to run?"
echo "1) Server"
echo "2) Client"
echo "3) Both"
read -p "Choice (1/2/3): " choice

if [ "$choice" == "1" ]; then
  echo "Building and starting server..."
  (cd server && docker compose build && docker compose up -d)

elif [ "$choice" == "2" ]; then
  echo "Building and starting client..."
  (cd client && docker compose build && docker compose up -d)

elif [ "$choice" == "3" ]; then
  echo "Building server..."
  (cd server && docker compose build)
  echo "Building client..."
  (cd client && docker compose build)
  echo "Starting server..."
  (cd server && docker compose up -d)
  echo "Starting client..."
  (cd client && docker compose up -d)

else
  echo "Invalid choice"
  exit 1
fi

read -p "Do you want to run the seed script? (y/n): " run_seed
if [ "$run_seed" == "y" ]; then
  echo "Running seed script..."
  docker compose -f server/docker-compose.yml exec api npm run seed
else
  echo "Skipping seed script."
fi
