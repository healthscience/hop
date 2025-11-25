#!/bin/bash
# Docker command for OpenHands with persistent workspace for BentoBoxDS & HOP
# 
# IMPORTANT: This script ensures your 30+ minute setup work persists between container restarts!
# Without these volume mounts, all repositories, npm links, and model files will be lost.

# First, create the persistent directories on your host machine
echo "Creating persistent directories..."
mkdir -p ~/openhands-persistent/workspace
mkdir -p ~/openhands-persistent/models
mkdir -p ~/openhands-persistent/npm-cache

echo ""
echo "Persistent directories created at:"
echo "  - Workspace: ~/openhands-persistent/workspace (stores all repositories)"
echo "  - Models: ~/openhands-persistent/models (stores AI model files)"
echo "  - NPM Cache: ~/openhands-persistent/npm-cache (speeds up npm installs)"
echo ""

# Pull the latest images
echo "Pulling latest OpenHands images..."
docker pull docker.openhands.dev/openhands/runtime:0.62-nikolaik
docker pull docker.openhands.dev/openhands/openhands:0.62

# Run OpenHands with persistent volumes
echo ""
echo "Starting OpenHands with persistent workspace..."
echo "Your work will be saved in ~/openhands-persistent/"
echo ""
docker run -it --rm --pull=always \
    -e SANDBOX_RUNTIME_CONTAINER_IMAGE=docker.openhands.dev/openhands/runtime:0.62-nikolaik \
    -e LOG_ALL_EVENTS=true \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v ~/.openhands:/.openhands \
    -v ~/openhands-persistent/workspace:/workspace \
    -v ~/openhands-persistent/models:/root/.hop-models \
    -v ~/openhands-persistent/npm-cache:/root/.npm \
    -p 3000:3000 \
    --add-host host.docker.internal:host-gateway \
    --name openhands-app \
    docker.openhands.dev/openhands/openhands:0.62