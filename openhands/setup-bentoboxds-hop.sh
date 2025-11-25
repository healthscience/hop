#!/bin/bash
# BentoBoxDS & HOP Automated Setup Script
# This script automates the complex setup process for BentoBoxDS with HOP

set -e  # Exit on error

WORKSPACE="/workspace"
MODEL_DIR="/root/.hop-models/beebee"
MODEL_URL="https://huggingface.co/healthscience/openhands-lm-1.5b-v0.1-GGUF/resolve/main/openhands-lm-1.5b-v0.1-q4_0.gguf"
MODEL_ORIGINAL="openhands-lm-1.5b-v0.1-q4_0.gguf"
MODEL_RENAMED="openhands-lm-1.5b-v0.1.i1-Q4_0.gguf"

echo "========================================="
echo "BentoBoxDS & HOP Environment Setup"
echo "========================================="

# Function to clone or update repository
clone_or_update() {
    local repo_url=$1
    local dir_name=$2
    local branch=$3
    
    if [ -d "$WORKSPACE/$dir_name" ]; then
        echo "✓ $dir_name already exists, updating..."
        cd "$WORKSPACE/$dir_name"
        git fetch
        git checkout $branch
        git pull origin $branch
    else
        echo "→ Cloning $dir_name..."
        cd "$WORKSPACE"
        git clone "$repo_url" "$dir_name"
        cd "$dir_name"
        git checkout $branch
    fi
    
    echo "→ Installing npm dependencies for $dir_name..."
    npm install
}

# Step 1: Clone/Update all repositories
echo ""
echo "Step 1: Setting up repositories..."
echo "---------------------------------"

clone_or_update "https://github.com/healthscience/bentoboxds.git" "bentoboxds" "training"
clone_or_update "https://github.com/healthscience/hop.git" "hop" "agent"
clone_or_update "https://github.com/healthscience/bbAI.git" "beebee-ai" "agent"
clone_or_update "https://github.com/healthscience/library-hop.git" "library-hop" "main"
clone_or_update "https://github.com/healthscience/node-safeflow.git" "node-safeflow" "master"
clone_or_update "https://github.com/healthscience/librarycomposer.git" "librarycomposer" "HEAD"

# Step 2: Create npm links
echo ""
echo "Step 2: Creating npm links..."
echo "-----------------------------"

# Check if links already exist
if [ ! -L "$WORKSPACE/hop/node_modules/beebee-ai" ]; then
    echo "→ Creating global npm links..."
    cd "$WORKSPACE/beebee-ai" && npm link
    cd "$WORKSPACE/library-hop" && npm link
    cd "$WORKSPACE/node-safeflow" && npm link
    cd "$WORKSPACE/librarycomposer" && npm link
    
    echo "→ Linking packages to HOP..."
    cd "$WORKSPACE/hop"
    npm link beebee-ai library-hop node-safeflow librarycomposer
    echo "✓ NPM links created successfully"
else
    echo "✓ NPM links already exist"
fi

# Step 3: Download model file
echo ""
echo "Step 3: Setting up AI model..."
echo "------------------------------"

mkdir -p "$MODEL_DIR"

if [ -f "$MODEL_DIR/$MODEL_RENAMED" ]; then
    echo "✓ Model file already exists"
else
    echo "→ Downloading GGUF model (892MB)..."
    cd "$MODEL_DIR"
    
    # Download with progress bar
    wget --progress=bar:force "$MODEL_URL" -O "$MODEL_ORIGINAL"
    
    echo "→ Renaming model file..."
    mv "$MODEL_ORIGINAL" "$MODEL_RENAMED"
    echo "✓ Model setup complete"
fi

# Step 4: Verify setup
echo ""
echo "Step 4: Verifying setup..."
echo "--------------------------"

# Check all repositories
for repo in bentoboxds hop beebee-ai library-hop node-safeflow librarycomposer; do
    if [ -d "$WORKSPACE/$repo" ]; then
        echo "✓ $repo repository exists"
    else
        echo "✗ $repo repository missing!"
        exit 1
    fi
done

# Check npm links
if [ -L "$WORKSPACE/hop/node_modules/beebee-ai" ]; then
    echo "✓ NPM links verified"
else
    echo "✗ NPM links not properly set up!"
    exit 1
fi

# Check model file
if [ -f "$MODEL_DIR/$MODEL_RENAMED" ]; then
    echo "✓ Model file verified"
else
    echo "✗ Model file missing!"
    exit 1
fi

echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "To start the services:"
echo "  Terminal 1: cd $WORKSPACE/bentoboxds && npm run dev"
echo "  Terminal 2: cd $WORKSPACE/hop && npm start"
echo ""
echo "To run tests:"
echo "  cd $WORKSPACE/bentoboxds && npx cypress run --spec cypress/e2e/chat/basicChat.cy.js"
echo ""
echo "Important reminders:"
echo "  - BentoBoxDS runs on https://localhost:5173/"
echo "  - HOP runs on port 9888"
echo "  - holepunch-hop is NOT npm linked (installed as regular dependency)"
echo ""
