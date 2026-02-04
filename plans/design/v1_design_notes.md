# HOP & BentoBoxDS Design Notes

## code repositories
https://github.com/healthscience?tab=repositories 

## Project Overview
This project consists of three main components:
1.  **HOP (`hop-ecs`)**: The backend/protocol layer. Handles P2P networking, data storage, and AI integration.
2.  **BentoBoxDS (`bentoboxds`)**: The frontend/desktop application. Built with Vue.js and Electron.
3.  **node-safeflow (`node-safeflow`)**: The heart of HOP, ECS and compute engine that produces coherence ledger entries.
4.  **holepunch-hop (`holepunch-hop`)**: Peer data store and peer to peer networking.
5.  **Library-hop (`library-hop`)**: The interface library connecting HOP and BentoBoxDS, managing contracts and data structures.

## Strategic Roadmap
The agreed strategy is to **complete the design of Version 1.0** before undertaking the major infrastructure upgrade to **Bare.js**.

### Phase 1: Version 1.0 Design Completion
**Goal:** Stabilize the current architecture, address technical debt, and ensure feature completeness.

**Critical Areas for V1.0:**
*   **Security (HOP):**
    *   Implement Schnorr signature verification (`hop/src/index.js`).
    *   Ensure secure peer authentication.
*   **Reliability (HOP):**
    *   Implement data structure validation in `hop/src/safeflow/index.js`.
    *   Verify contract management in `library-hop`.
*   **Usability (BentoBoxDS):**
    *   Fix UI/UX issues (SpaceMenu filters, ResearchCues history).
    *   Address TODOs in `joinnxpView.vue` (hashing) and `peerList.vue`.

### Phase 2: Bare.js Upgrade
**Goal:** Remove Websocket dependency and migrate to a Bare.js compatible networking stack to support new targets (Web, Mobile, Desktop).

**Key Changes:**
*   **Remove `ws`:** Replace the Websocket server in HOP and client in BentoBoxDS.
*   **Adopt Bare/Pear Networking:** Use native P2P primitives (likely via `holepunch-hop` or `pear`) for communication.
*   **Runtime Migration:** Ensure code compatibility with the Bare.js runtime.

## Technical Debt & TODOs
**HOP:**
*   `src/index.js`: `// TODO schnorr sig verifty and setup`
*   `src/safeflow/index.js`: `// need to check structure TODO`

**BentoBoxDS:**
*   `src/components/beebeeView/navigation/spaceMenu.vue`: Filter optimization.
*   `src/components/bentocues/research/researchCues.vue`: Save entry to space history.
*   `src/components/library/contracts/join/joinnxpView.vue`: Hash generation.
*   `src/components/dataspace/upload/uploadSpace.vue`: Socket communication (relevant to Phase 2).

## Besearch & Library Requirements (from BentoBoxDS Plans)
**Library Architecture:**
*   **Network Experiment (NXP):** Must bundle 4 module contracts: Question, Data Packaging, Compute, Visualization.
*   **Reference vs Module Contracts:** Clear separation and management in `library-hop`.

**Besearch Experience:**
*   **4-Stage Cycle:** Data -> Research -> Compute -> Simulation.
*   **World-Flip Navigation:** Seamless switching between Body Diagram, CueSpace, and Besearch Canvas.
*   **Peer Cases:** Support for "Daily Average Heart Rate" and "Creatine Intervention" as validation cases.

## Core Architecture Additions (V1.0)
**1. Heli Clock Integration:**
*   **Goal:** Add `HeliCore` (WASM engine) as a core module in `HOP`.
*   **Function:** Convert timestamps to Orbital Vectors (Solar/Earth degrees) for the "Coherence Ledger".
*   **Implementation:**
    *   Port `heli_engine.js` and WASM from `bentoboxds` to `hop/src/heliclock/`.
    *   Expose `HeliCore` functionality to `Besearch` and `Safeflow`.

**2. Besearch Module (HOP):**
*   **Goal:** Implement the backend logic for the Besearch cycle.
*   **Dependencies:** `HeliClock`, `node-safeflow` (Coherence Ledger), `holepunch-hop`.
*   **Function:** Trigger compute based on Heli Clock cycles and manage the DML protocol.

**3. Integration:**
*   `HOP` must initialize `HeliClock` and `Besearch` modules.
*   `Besearch` module must interact with `SafeFlow` to write to the Coherence Ledger.

## Key Files
*   `library-hop/src/index.js`: Main interface class `LibraryHop`.
*   `library-hop/src/tools/contracts.js`: Contract management logic.
*   `hop/src/index.js`: Main entry point for HOP.
*   `bentoboxds/src/main.js`: Main entry point for BentoBoxDS.
