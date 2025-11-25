# BentoBoxDS & HOP Quick Setup Overview

## 1. Install BentoBoxDS (training branch)
```bash
git clone https://github.com/healthscience/bentoboxds.git
cd bentoboxds
git checkout training  # Active development branch
npm install
```

## 2. Install HOP (agent branch)
```bash
git clone https://github.com/healthscience/hop-protocol.git hop
cd hop
git checkout agent  # Has beebeeFlow method
npm install
```

## 3. Install and Link NPM Packages

### Clone all required repos:
```bash
# beebee-ai (agent branch)
git clone https://github.com/healthscience/bbAI.git beebee-ai
cd beebee-ai && git checkout agent && npm install

# library-hop (main branch)
git clone https://github.com/healthscience/library-hop.git
cd library-hop && git checkout main && npm install

# node-safeflow (master branch)
git clone https://github.com/healthscience/node-safeflow.git
cd node-safeflow && git checkout master && npm install

# librarycomposer
git clone https://github.com/healthscience/librarycomposer.git
cd librarycomposer && npm install
```

### Create npm links:
```bash
# Create global links
cd beebee-ai && npm link
cd library-hop && npm link
cd node-safeflow && npm link
cd librarycomposer && npm link

# Link them ALL to HOP (not BentoBoxDS!)
cd hop
npm link beebee-ai library-hop node-safeflow librarycomposer
```

**NOTE**: Do NOT npm link holepunch-hop!

## 4. Install Model File

### Get model info from desktop repo:
- Model: openhands-lm-1.5b-v0.1-q4_0.gguf
- Size: ~892MB
- Source: Hugging Face

### Download and setup:
```bash
# Create directory
mkdir -p ~/.hop-models/beebee/

# Download GGUF file
cd ~/.hop-models/beebee/
wget https://huggingface.co/healthscience/openhands-lm-1.5b-v0.1-GGUF/resolve/main/openhands-lm-1.5b-v0.1-q4_0.gguf

# IMPORTANT: Rename the file
mv openhands-lm-1.5b-v0.1-q4_0.gguf openhands-lm-1.5b-v0.1.i1-Q4_0.gguf
```

## 5. Fix SSL/HTTPS Certificate Issues for Testing

### Update Cypress configuration:
In `/workspace/bentoboxds/cypress.config.js`, ensure it has:

```javascript
const { defineConfig } = require('cypress')
const { spawn } = require('child_process')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://localhost:5173',
    setupNodeEvents(on, config) {
      // Start HOP server before tests
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
          
          setTimeout(resolve, 5000)
        })
      })
      
      return config
    },
    // CRITICAL: Ignore SSL certificate errors
    chromeWebSecurity: false,
  },
})
```

### For HTTPS testing, also ensure:
- Vite dev server uses HTTPS (should be configured in vite.config.js)
- NODE_TLS_REJECT_UNAUTHORIZED=0 may be needed for some environments

## Running Tests

```bash
cd /workspace/bentoboxds

# Run specific test
npx cypress run --spec cypress/e2e/chat/basicChat.cy.js

# Or run all tests
npx cypress run
```

## That's it!

Start services:
- BentoBoxDS: `npm run dev` (HTTPS on port 5173)
- HOP: `npm start` (port 9888)