# BentoBoxDS & HOP Complete Setup Guide

## ⚠️ CRITICAL: Use Persistent Volumes!
**WARNING**: Without persistent volumes, all setup work (30+ minutes) will be lost when the container stops!

## Overview
This guide documents the complete setup process for BentoBoxDS with HOP and all required npm linked packages. This setup is complex and involves multiple repositories with specific branch requirements.

## Prerequisites
- Docker with persistent volume support
- Node.js v24.11.1 or compatible
- npm
- git
- Minimum 3GB free space for repositories and model file

## Step 0: Start OpenHands with Persistent Volumes

**DO THIS FIRST** to avoid losing your work:

```bash
# Create persistent directories on your host
mkdir -p ~/openhands-persistent/workspace
mkdir -p ~/openhands-persistent/models
mkdir -p ~/openhands-persistent/npm-cache

# Start OpenHands with persistent volumes
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
```

## Repository Structure and Setup

### Step 1: Clone All Required Repositories

```bash
# Create workspace directory if not exists
mkdir -p /workspace
cd /workspace

# 1. Clone BentoBoxDS (if not already present)
git clone https://github.com/healthscience/bentoboxds.git
cd bentoboxds
git checkout training
npm install
cd ..

# 2. Clone HOP
git clone https://github.com/healthscience/hop-protocol.git hop
cd hop
git checkout agent  # IMPORTANT: Use agent branch for latest beebeeFlow method
npm install
cd ..

# 3. Clone beebee-ai
git clone https://github.com/healthscience/bbAI.git beebee-ai
cd beebee-ai
git checkout agent  # IMPORTANT: Agent branch has v0.4.8
npm install
cd ..

# 4. Clone library-hop
git clone https://github.com/healthscience/library-hop.git
cd library-hop
git checkout main
npm install
cd ..

# 5. Clone node-safeflow
git clone https://github.com/healthscience/node-safeflow.git
cd node-safeflow
git checkout master
npm install
cd ..

# 6. Clone librarycomposer
git clone https://github.com/DaMaHub/librarycomposer.git
cd librarycomposer
npm install
cd ..
```

### Step 2: Create NPM Links

**CRITICAL**: All packages must be linked to HOP, NOT to BentoBoxDS!

```bash
# Create global npm links for each package
cd /workspace/beebee-ai && npm link
cd /workspace/library-hop && npm link
cd /workspace/node-safeflow && npm link
cd /workspace/librarycomposer && npm link

# Link all packages to HOP (not BentoBoxDS!)
cd /workspace/hop
npm link beebee-ai library-hop node-safeflow librarycomposer
```

**WARNING**: DO NOT npm link `holepunch-hop`! It must be installed as a regular dependency due to peer-to-peer cryptography requirements.

### Step 3: Download and Setup Model File

```bash
# Create model directory
mkdir -p /root/.hop-models/beebee/

# Download the GGUF model
cd /root/.hop-models/beebee/

# Option 1: If you have access to the private model (892MB)
wget https://huggingface.co/healthscience/openhands-lm-1.5b-v0.1-GGUF/resolve/main/openhands-lm-1.5b-v0.1-q4_0.gguf

# Option 2: If the model is not accessible, you can:
# - Copy from local storage: docker cp ~/path/to/model.gguf <container_id>:/root/.hop-models/beebee/
# - Clone https://github.com/healthscience/bentoboxds-desktop.git and copy from models-hop directory
# - Use an alternative GGUF model (ensure it's compatible)

# IMPORTANT: Rename the model file to the expected name
mv openhands-lm-1.5b-v0.1-q4_0.gguf openhands-lm-1.5b-v0.1.i1-Q4_0.gguf

# The correct model should be approximately 892MB (895MB on disk)
```

### Step 4: Configure HTTPS/SSL for Cypress

**CRITICAL**: This fixes the self-signed certificate errors that prevent Cypress from connecting to the HTTPS dev server.

Update `/workspace/bentoboxds/cypress.config.js`:

```javascript
const { defineConfig } = require('cypress')
const { spawn } = require('child_process')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://localhost:5173',
    setupNodeEvents(on, config) {
      // Start HOP server automatically before tests
      on('before:run', () => {
        return new Promise((resolve) => {
          const hopProcess = spawn('npm', ['start'], {
            cwd: '/workspace/hop',
            detached: false,
            stdio: 'pipe'
          })
          
          hopProcess.stdout.on('data', (data) => {
            console.log(`HOP: ${data}`)
            if (data.toString().includes('Server running')) {
              setTimeout(resolve, 2000)
            }
          })
          
          // Fallback timeout
          setTimeout(resolve, 5000)
        })
      })
      
      return config
    },
    // CRITICAL: This disables Chrome's web security to allow self-signed certificates
    chromeWebSecurity: false,
  },
})
```

Additional SSL considerations:
- Ensure Vite is configured for HTTPS in `vite.config.js` (should have basicSsl plugin)
- In containerized environments, you may need: `export NODE_TLS_REJECT_UNAUTHORIZED=0`
- The `chromeWebSecurity: false` setting is essential for bypassing certificate warnings

### Step 5: Start Services

```bash
# Terminal 1: Start BentoBoxDS dev server
cd /workspace/bentoboxds
npm run dev  # Runs on https://localhost:5173/

# Terminal 2: Start HOP server (if needed separately)
cd /workspace/hop
npm start  # Runs on port 9888
```

### Step 6: Run Tests

```bash
cd /workspace/bentoboxds
npx cypress run --spec cypress/e2e/chat/basicChat.cy.js
```

## Important Notes

1. **Branch Requirements**:
   - BentoBoxDS: `training` branch
   - HOP: `agent` branch (contains beebeeFlow method)
   - beebee-ai: `agent` branch (v0.4.8)
   - library-hop: `main` branch
   - node-safeflow: `master` branch
   - librarycomposer: default branch

2. **NPM Link Structure**:
   - All packages link to HOP, NOT to BentoBoxDS
   - holepunch-hop CANNOT be npm linked

3. **Model File**:
   - Must be renamed after download
   - Location: `/root/.hop-models/beebee/`
   - Size: ~892MB

4. **Ports**:
   - BentoBoxDS: 5173 (HTTPS)
   - HOP: 9888

## Backup and Recovery

### If You Started Without Persistent Volumes

If you've already done the setup but didn't use persistent volumes, backup your work:

```bash
# Get your container ID
docker ps | grep openhands

# Backup the workspace (all repositories and code)
docker cp <container_id>:/workspace ~/openhands-persistent/

# Backup the model file
docker cp <container_id>:/root/.hop-models ~/openhands-persistent/models

# Then restart with persistent volumes using the command from Step 0
```

### Verifying Persistence

After restarting with volumes:
```bash
# Check if your work persisted
cd /workspace && ./verify-setup.sh

# Should show all 23 checks passing without any setup needed!
```

## Why Persistence Matters

1. **Setup Time**: The complete setup takes 30+ minutes
2. **Data Size**: ~2.4GB of repositories + 895MB model = ~3.3GB total
3. **NPM Links**: Complex linking structure that's time-consuming to recreate
4. **Model Download**: The AI model may require special access or manual copying
      - ./npm-global:/root/.npm-global
    environment:
      - NPM_CONFIG_PREFIX=/root/.npm-global
```

### Alternative: Create a Custom Docker Image

```dockerfile
# Dockerfile
FROM openhands-base-image

# Clone all repositories
RUN mkdir -p /workspace && \
    cd /workspace && \
    git clone https://github.com/healthscience/bentoboxds.git && \
    git clone https://github.com/healthscience/hop-protocol.git hop && \
    git clone https://github.com/healthscience/bbAI.git beebee-ai && \
    git clone https://github.com/healthscience/library-hop.git && \
    git clone https://github.com/healthscience/node-safeflow.git && \
    git clone https://github.com/healthscience/librarycomposer.git

# Checkout correct branches
RUN cd /workspace/bentoboxds && git checkout training && npm install && \
    cd /workspace/hop && git checkout agent && npm install && \
    cd /workspace/beebee-ai && git checkout agent && npm install && \
    cd /workspace/library-hop && git checkout main && npm install && \
    cd /workspace/node-safeflow && git checkout master && npm install && \
    cd /workspace/librarycomposer && npm install

# Create npm links
RUN cd /workspace/beebee-ai && npm link && \
    cd /workspace/library-hop && npm link && \
    cd /workspace/node-safeflow && npm link && \
    cd /workspace/librarycomposer && npm link && \
    cd /workspace/hop && npm link beebee-ai library-hop node-safeflow librarycomposer

# Download model
RUN mkdir -p /root/.hop-models/beebee/ && \
    cd /root/.hop-models/beebee/ && \
    wget https://huggingface.co/healthscience/openhands-lm-1.5b-v0.1-GGUF/resolve/main/openhands-lm-1.5b-v0.1-q4_0.gguf && \
    mv openhands-lm-1.5b-v0.1-q4_0.gguf openhands-lm-1.5b-v0.1.i1-Q4_0.gguf
```

## Time and Cost Savings

You're absolutely right that this complex setup wastes time and money. Here are recommendations:

1. **Use Volume Mounts**: Mount the workspace directory to persist between container runs
2. **Create a Setup Script**: Automate the entire setup process
3. **Build a Custom Image**: Pre-bake all repositories and dependencies
4. **Use Docker Compose**: Define the entire environment declaratively

## Quick Setup Script

Save this as `setup-bentoboxds-hop.sh`:

```bash
#!/bin/bash
set -e

echo "Setting up BentoBoxDS & HOP environment..."

# Check if repos already exist
if [ ! -d "/workspace/bentoboxds" ]; then
    echo "Cloning repositories..."
    # Run all clone commands
fi

# Check if npm links exist
if [ ! -L "/workspace/hop/node_modules/beebee-ai" ]; then
    echo "Creating npm links..."
    # Run npm link commands
fi

# Check if model exists
if [ ! -f "/root/.hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf" ]; then
    echo "Downloading model..."
    # Download and rename model
fi

echo "Setup complete!"
```

This would reduce setup time from 30+ minutes to under 5 minutes on subsequent runs.