# Docker Persistence Solution for BentoBoxDS & HOP

## The Problem

When you stop and restart the OpenHands Docker container, all the cloned repositories, npm links, and downloaded models are lost. This happens because Docker containers are ephemeral by default - they don't persist changes unless explicitly configured to do so.

This results in:
- 30+ minutes of setup time for each new session
- Repeated downloading of the 892MB model file
- Increased costs due to repeated API calls and setup time
- Frustration from having to remember complex setup steps

## Solutions

### Solution 1: Use Docker Volumes (Recommended)

When starting OpenHands, mount volumes to persist the workspace:

```bash
# Create persistent directories on your host
mkdir -p ~/openhands-persistent/workspace
mkdir -p ~/openhands-persistent/models
mkdir -p ~/openhands-persistent/npm-cache

# Run OpenHands with mounted volumes
docker run -it \
  -v ~/openhands-persistent/workspace:/workspace \
  -v ~/openhands-persistent/models:/root/.hop-models \
  -v ~/openhands-persistent/npm-cache:/root/.npm \
  [other docker options] \
  openhands-image
```

### Solution 2: Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  openhands:
    image: openhands-image  # Replace with actual image name
    volumes:
      - ./workspace:/workspace
      - ./hop-models:/root/.hop-models
      - ./npm-cache:/root/.npm
      - ./npm-global:/root/.npm-global
    environment:
      - NPM_CONFIG_PREFIX=/root/.npm-global
    ports:
      - "5173:5173"  # BentoBoxDS
      - "9888:9888"  # HOP
      - "52785:52785"  # OpenHands ports
      - "58382:58382"
    stdin_open: true
    tty: true
```

Then run with: `docker-compose up`

### Solution 3: Create a Custom Docker Image

Create a `Dockerfile.bentoboxds-hop`:

```dockerfile
FROM openhands-image  # Replace with actual base image

# Install any missing dependencies
RUN apt-get update && apt-get install -y wget

# Clone all repositories with correct branches
RUN mkdir -p /workspace && cd /workspace && \
    git clone https://github.com/healthscience/bentoboxds.git && \
    cd bentoboxds && git checkout training && npm install && \
    cd /workspace && \
    git clone https://github.com/healthscience/hop-protocol.git hop && \
    cd hop && git checkout agent && npm install && \
    cd /workspace && \
    git clone https://github.com/healthscience/bbAI.git beebee-ai && \
    cd beebee-ai && git checkout agent && npm install && \
    cd /workspace && \
    git clone https://github.com/healthscience/library-hop.git && \
    cd library-hop && git checkout main && npm install && \
    cd /workspace && \
    git clone https://github.com/healthscience/node-safeflow.git && \
    cd node-safeflow && git checkout master && npm install && \
    cd /workspace && \
    git clone https://github.com/healthscience/librarycomposer.git && \
    cd librarycomposer && npm install

# Create npm links
RUN cd /workspace/beebee-ai && npm link && \
    cd /workspace/library-hop && npm link && \
    cd /workspace/node-safeflow && npm link && \
    cd /workspace/librarycomposer && npm link && \
    cd /workspace/hop && \
    npm link beebee-ai library-hop node-safeflow librarycomposer

# Download and setup model
RUN mkdir -p /root/.hop-models/beebee && \
    cd /root/.hop-models/beebee && \
    wget https://huggingface.co/healthscience/openhands-lm-1.5b-v0.1-GGUF/resolve/main/openhands-lm-1.5b-v0.1-q4_0.gguf && \
    mv openhands-lm-1.5b-v0.1-q4_0.gguf openhands-lm-1.5b-v0.1.i1-Q4_0.gguf

# Copy setup script
COPY setup-bentoboxds-hop.sh /workspace/
RUN chmod +x /workspace/setup-bentoboxds-hop.sh

WORKDIR /workspace
```

Build with: `docker build -f Dockerfile.bentoboxds-hop -t openhands-bentoboxds-hop .`

### Solution 4: Quick Start Script for Existing Container

If you can't modify how the container starts, create this script to run inside the container:

```bash
#!/bin/bash
# Save as: quick-restore.sh

# Check if setup was already done
if [ -f "/workspace/.setup-complete" ]; then
    echo "Setup already complete, just updating..."
    cd /workspace/bentoboxds && git pull
    cd /workspace/hop && git pull
    # ... etc
else
    # Run full setup
    /workspace/setup-bentoboxds-hop.sh
    touch /workspace/.setup-complete
fi
```

## Recommended Approach

1. **For Development**: Use Docker volumes (Solution 1) to persist your workspace between sessions
2. **For Team/Production**: Create a custom Docker image (Solution 3) with everything pre-installed
3. **For Quick Testing**: Use the automated setup script we created

## Time Savings

- Initial setup: 30-45 minutes
- With volumes: 0 minutes (instant)
- With custom image: 0 minutes (instant)
- With setup script: 3-5 minutes (only npm install updates)

## Cost Savings

- Reduced API usage for repeated setup instructions
- No repeated model downloads (892MB each time)
- Faster development cycles
- Less time spent on setup = more time for actual work

## Implementation Steps

1. Choose your preferred solution based on your needs
2. If using volumes, create the persistent directories first
3. Modify your Docker run command or create docker-compose.yml
4. Run the setup script once to populate the volumes
5. Enjoy persistent workspace on every restart!

Remember: The key is to mount the `/workspace` and `/root/.hop-models` directories as volumes so they persist between container restarts.