# OpenHands Persistence Quick Guide

## ⚠️ Critical: Always Use Persistent Volumes!

Without persistent volumes, your entire BentoBoxDS & HOP setup (30+ minutes of work) will be **LOST** when the container stops!

## Quick Start with Persistence

```bash
# 1. Create persistent directories (one time only)
mkdir -p ~/openhands-persistent/workspace
mkdir -p ~/openhands-persistent/models
mkdir -p ~/openhands-persistent/npm-cache

# 2. Start OpenHands with volumes
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

## What Gets Persisted

| Volume Mount | Container Path | What's Stored | Size |
|--------------|----------------|---------------|------|
| `~/openhands-persistent/workspace` | `/workspace` | All repositories, code, scripts | ~2.4GB |
| `~/openhands-persistent/models` | `/root/.hop-models` | AI model files | ~895MB |
| `~/openhands-persistent/npm-cache` | `/root/.npm` | NPM cache for faster installs | Variable |

## If You Forgot to Use Volumes

Don't panic! Backup your work before the container stops:

```bash
# Get container ID
docker ps | grep openhands

# Backup everything (replace <container_id> with actual ID)
docker cp <container_id>:/workspace ~/openhands-persistent/
docker cp <container_id>:/root/.hop-models ~/openhands-persistent/models
```

## Verify Persistence Works

After restarting with volumes:
```bash
cd /workspace && ./verify-setup.sh
```

Should show: **✅ All checks passed! (23/23)**

## Key Benefits

1. **No Repeated Setup**: Save 30+ minutes per restart
2. **Work Continuity**: All code changes persist
3. **Model Persistence**: No need to re-download the 895MB model
4. **NPM Link Preservation**: Complex linking structure maintained

## Remember

- Always use the full docker command with `-v` volume mounts
- Create the host directories before first run
- Your work is saved in `~/openhands-persistent/`
- You can backup this directory for extra safety