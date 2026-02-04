# HOP V1.0 Design Specification

## 1. System Architecture
The Health Oracle Protocol (HOP) V1.0 is a decentralized system composed of five core components:

1.  **HOP (`hop-ecs`)**: The backend protocol node. Orchestrates modules and manages the P2P lifecycle.
2.  **BentoBoxDS (`bentoboxds`)**: The frontend desktop application (Vue/Electron). Provides the user interface for Besearch, DataSpace, and Peer interactions.
3.  **Node-Safeflow (`node-safeflow`)**: The Entity Component System (ECS) engine. Manages the "Coherence Ledger" and executes compute flows.
4.  **Holepunch-HOP (`holepunch-hop`)**: The networking and storage layer. Handles Hypercore-based peer storage and P2P discovery.
5.  **Library-HOP (`library-hop`)**: The shared interface library. Defines contracts (Reference, Module, NXP) and data structures.
6  **beebee-ai ('beebee-ai')** tiny LLM support peer and manages peer besearch cycles, @teach DML
7  **Besearch (`besearch`)**: The science experiments cycles and decentralized machine learning module, tiny agents.

### Interaction Diagram
```mermaid
graph TD
    BentoBoxDS[BentoBoxDS (Frontend)] <-->|Websocket/IPC| HOP[HOP (Backend)]
    HOP --> LibraryHop[Library-HOP]
    HOP --> HeliClock[HeliClock Module]
    HOP --> Besearch[Besearch Module]
    HOP --> SafeFlow[Node-Safeflow]
    HOP --> Holepunch[Holepunch-HOP]
    
    Besearch -->|Trigger Compute| SafeFlow
    Besearch -->|Get Time| HeliClock
    SafeFlow -->|Write Ledger| Holepunch
    LibraryHop -->|Define Contracts| SafeFlow
```

## 2. Core Module Specifications

### 2.1 HeliClock Module (`hop/src/heliclock`)
**Responsibility:** Provide "Orbital Vector" time for the Coherence Ledger.
**Source:** Ported from `bentoboxds/src/wasm/heli_engine.js`.
**API:**
*   `getOrbitalVector(timestamp)`: Returns `{ solar: float, earth: float, cycle: int }`.
*   `getZenith(lat, lon, timestamp)`: Returns zenith angle.

### 2.2 Besearch Module (`hop/src/besearch`)
**Responsibility:** Manage the Besearch cycle (Data -> Research -> Compute -> Emulation) and Decentralized Machine Learning (DML).
**Dependencies:** `HeliClock`, `SafeFlow`, `Holepunch-HOP` (Hyperbee).
**Detailed Logic:** See `../hop/plans/besearch/cycle_logic.md`.

**Key Functions:**
*   `startCycle(nxpId, context)`: Initiates a new besearch cycle.
*   `triggerCompute(cycleId)`: Calls `SafeFlow` to execute the NXP's compute module.
*   `consensusCheck(cycleId)`: Verifies results against the network (DML).

### 2.3 Node-Safeflow Integration
**Responsibility:** Execute the compute logic defined in NXP contracts and produce "Coherence Ledger" entries.
**Integration Point:** `hop/src/safeflow/index.js`.
**Data Flow:**
1.  Receives `networkexperiment` message.
2.  Validates structure (TODO).
3.  Executes flow via `SafeFlowECS`.
4.  Hashes result + Proof of Work -> Coherence Ledger Entry.

## 3. Data Flow: The "Solar Cycle Average" Case
1.  **Data In:** Peer imports Heart Rate data via BentoBoxDS.
2.  **Normalization:** Data is normalized to 0-1 range (Z-score).
3.  **Time Conversion:** Timestamps converted to Orbital Vectors via `HeliClock`.
4.  **Besearch Trigger:** Peer initiates "Daily Average" cycle.
5.  **Compute:** `Besearch` module triggers `SafeFlow` to calculate average.
6.  **Ledger:** Result is written to Coherence Ledger via `Holepunch`.
7.  **Consensus:** (Future) Other peers validate the computation.

## 4. Security Model
*   **Authentication:** Peers authenticate via Schnorr signatures (TODO in `hop/src/index.js`).
*   **Authorization:** Access to private data is controlled via `holepunch-hop` encryption keys.
*   **Integrity:** Ledger entries are immutable and cryptographically linked.

## 5. Implementation Plan (Immediate)
1.  **Port HeliClock:** Move WASM and JS wrapper to `hop`.
2.  **Create Besearch Module:** Implement the class structure in `hop`.
3.  **Wire Up:** Initialize modules in `hop/src/index.js`.
4.  **Validate:** Run the "Solar Cycle Average" case end-to-end.
