#!/bin/bash

echo "Starting worker: $WORKER_TYPE"

case "$WORKER_TYPE" in
  "story-pages")
    npm run worker:story-pages
    ;;
  "image")
    npm run worker:image
    ;;
  "video")
    npm run worker:video
    ;;
  "speech")
    npm run worker:speech
    ;;
  *)
    echo "Unknown worker type: $WORKER_TYPE"
    echo "Available types: story-pages, image, video, speech"
    exit 1
    ;;
esac
