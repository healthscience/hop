# 🧠 TINY_LEARNING_STACK.md: Multi-Modal Peer Learning

## 1. The Architectural Philosophy
To maintain **Peer-First Compute**, we do not use a single "Mega-Model." Instead, we use a **Vertical Stack** of specialized learning technologies that transition from "Fast/Low-Power" (Sensory) to "Deep/Reasoning" (Interface).

---

## 2. The Four-Layer Stack

### Layer A: The Sensory Reservoir (Fast / Low-Power)
- **Technology:** **Reservoir Computing (Liquid State Machines)**.
- **Function:** Real-time processing of high-frequency time-series data (PPG, Accelerometer, Glucose).
- **Purpose:** Identifies the "Rhythm" of the peer without needing a full Transformer pass.
- **Output:** Raw signal features fed to Layer B.

### Layer B: The Homeostatic Pilot (Active Inference)
- **Technology:** **Active Inference (The Friston Model)**.
- **Function:** Maintains the **Goldilocks Zones** ($r_{min} \leftrightarrow r_{max}$).
- **Purpose:** Minimizes "Surprise." If biological data drifts toward "Overshoot," this layer calculates the **Contextual Buffer** (the correction) needed to return to Harmony.

### Layer C: The Evolutionary Seed (Neuroevolution)
- **Technology:** **NEAT (NeuroEvolution of Augmenting Topologies)**.
- **Function:** "Carves" the long-term geometry of the Digital Twin (The Emulator).
- **Purpose:** Over many Earth Cycles, this layer evolves the "Genome" of the TINY Agent (e.g., the specific drag-coefficient model for a 100m Swim) to match the Peer's unique physical signature.

### Layer D: The Human Interface (Nano-LLM)
- **Technology:** **Nano-Transformer (e.g., NanoChat architecture)**.
- **Function:** Natural Language First / **Zero-Draft Mode**.
- **Purpose:** Translates the Peer's `@teach` inputs into "Fitness Rewards" for the Evolution layer.
- **Autonomy:** Manages the **BeeBee Protocol** and network handshakes.

---

## 3. Data Flow: The "Consilience Loop"
1. **Sensation:** Layer A detects a specific arm-stroke vibration during a swim.
2. **Prediction:** Layer B compares this to the "Ideal Arc" of the current Emulator.
3. **Valuation:** Layer D (BeeBee) asks the Peer: *"That felt efficient. Should we prioritize this movement?"*
4. **Evolution:** If the Peer says "Yes" (`@teach`), Layer C "Rewards" that neural pathway, hardening it into the TINY Agent's **Genome**.

---

## 4. The "Cloning" Mechanism
When a TINY Agent is cloned to the network:
- **LLM Weights:** Not shared (Standard Nano-Bee used).
- **Reservoir Weights:** Not shared (Hardware specific).
- **The Genome (The Winner):** The **evolved NEAT topology** and **Active Inference parameters** are packaged as a `SEED.json`.

---

## 5. Implementation Constraints
- **Zero-Draft Priority:** The Nano-LLM must be able to initialize a "Zero-Draft" of any TINY agent from a simple text prompt.
- **Offline First:** Layers A and B must function without an internet connection to ensure "Selfish" biological safety.