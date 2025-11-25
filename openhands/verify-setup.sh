#!/bin/bash
# BentoBoxDS & HOP Setup Verification Script
# Run this after restarting OpenHands to verify persistence worked

set -e

echo "========================================="
echo "BentoBoxDS & HOP Setup Verification"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Function to check and report
check() {
    local description=$1
    local condition=$2
    
    if eval "$condition"; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $description"
        ((FAIL++))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local desc=$2
    check "$desc" "[ -d '$dir' ]"
}

# Function to check file exists
check_file() {
    local file=$1
    local desc=$2
    check "$desc" "[ -f '$file' ]"
}

# Function to check symlink exists
check_link() {
    local link=$1
    local desc=$2
    check "$desc" "[ -L '$link' ]"
}

echo "1. Checking Repositories..."
echo "----------------------------"
check_dir "/workspace/bentoboxds" "BentoBoxDS repository"
check_dir "/workspace/hop" "HOP repository"
check_dir "/workspace/beebee-ai" "beebee-ai repository"
check_dir "/workspace/library-hop" "library-hop repository"
check_dir "/workspace/node-safeflow" "node-safeflow repository"
check_dir "/workspace/librarycomposer" "librarycomposer repository"

echo ""
echo "2. Checking Git Branches..."
echo "---------------------------"
cd /workspace/bentoboxds 2>/dev/null && BRANCH=$(git branch --show-current)
check "BentoBoxDS on training branch" "[ '$BRANCH' = 'training' ]"

cd /workspace/hop 2>/dev/null && BRANCH=$(git branch --show-current)
check "HOP on agent branch" "[ '$BRANCH' = 'agent' ]"

cd /workspace/beebee-ai 2>/dev/null && BRANCH=$(git branch --show-current)
check "beebee-ai on agent branch" "[ '$BRANCH' = 'agent' ]"

cd /workspace/library-hop 2>/dev/null && BRANCH=$(git branch --show-current)
check "library-hop on main branch" "[ '$BRANCH' = 'main' ]"

cd /workspace/node-safeflow 2>/dev/null && BRANCH=$(git branch --show-current)
check "node-safeflow on master branch" "[ '$BRANCH' = 'master' ]"

echo ""
echo "3. Checking NPM Links..."
echo "------------------------"
check_link "/workspace/hop/node_modules/beebee-ai" "beebee-ai linked to HOP"
check_link "/workspace/hop/node_modules/library-hop" "library-hop linked to HOP"
check_link "/workspace/hop/node_modules/node-safeflow" "node-safeflow linked to HOP"
check_link "/workspace/hop/node_modules/librarycomposer" "librarycomposer linked to HOP"

# Check that holepunch-hop is NOT linked (should be regular dependency)
if [ -L "/workspace/hop/node_modules/holepunch-hop" ]; then
    echo -e "${RED}✗${NC} holepunch-hop is linked (should be regular dependency!)"
    ((FAIL++))
else
    echo -e "${GREEN}✓${NC} holepunch-hop is regular dependency (not linked)"
    ((PASS++))
fi

echo ""
echo "4. Checking Model File..."
echo "-------------------------"
check_file "/root/.hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf" "GGUF model file exists with correct name"

# Check file size (should be around 892MB)
if [ -f "/root/.hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf" ]; then
    SIZE=$(du -m "/root/.hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf" | cut -f1)
    if [ "$SIZE" -gt 800 ] && [ "$SIZE" -lt 1000 ]; then
        echo -e "${GREEN}✓${NC} Model file size correct (~${SIZE}MB)"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} Model file size unexpected: ${SIZE}MB (expected ~892MB)"
    fi
fi

echo ""
echo "5. Checking Configuration Files..."
echo "----------------------------------"
check_file "/workspace/bentoboxds/cypress.config.js" "Cypress configuration exists"

# Check for SSL configuration in cypress.config.js
if [ -f "/workspace/bentoboxds/cypress.config.js" ]; then
    if grep -q "chromeWebSecurity: false" "/workspace/bentoboxds/cypress.config.js"; then
        echo -e "${GREEN}✓${NC} Cypress SSL fix configured (chromeWebSecurity: false)"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Cypress SSL fix not found in config"
        ((FAIL++))
    fi
fi

echo ""
echo "6. Checking Node Modules..."
echo "---------------------------"
check_dir "/workspace/bentoboxds/node_modules" "BentoBoxDS dependencies installed"
check_dir "/workspace/hop/node_modules" "HOP dependencies installed"

echo ""
echo "7. Quick Functionality Test..."
echo "------------------------------"
# Check if we can start the dev server (just test if command exists)
cd /workspace/bentoboxds 2>/dev/null
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} npm available and package.json exists"
    ((PASS++))
else
    echo -e "${RED}✗${NC} npm or package.json not found"
    ((FAIL++))
fi

echo ""
echo "========================================="
echo "VERIFICATION SUMMARY"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your setup is ready to use.${NC}"
    echo ""
    echo "You can now:"
    echo "  1. Start BentoBoxDS: cd /workspace/bentoboxds && npm run dev"
    echo "  2. Start HOP: cd /workspace/hop && npm start"
    echo "  3. Run tests: cd /workspace/bentoboxds && npx cypress run --spec cypress/e2e/chat/basicChat.cy.js"
else
    echo -e "${RED}❌ Some checks failed. You may need to run the setup script.${NC}"
    echo ""
    echo "To fix issues, run:"
    echo "  cd /workspace && ./setup-bentoboxds-hop.sh"
fi

echo ""
echo "========================================="

# Return exit code based on failures
exit $FAIL