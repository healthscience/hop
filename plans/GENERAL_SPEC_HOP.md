# 🧬 SPEC_HOP.md: The Health Oracle Protocol

## 1. Executive Vision: "Pure Emulation"
HOP is a peer-to-peer protocol for the **Emulation** of biological and ecological systems. 
- **The Mantra:** "HOP is not a simulation of life. It is the P2P Emulation of the Orbit. We don't predict health; we mirror the resonance of the metabolism."
- **The Life-Strap:** Connective logic (WASM/JS) that tethers metabolic data to orbital coordinates via SVG `<line>` elements.

## 2. Core Logic: The Orbital Vector
All time-series data must be converted from Unix Timestamps to an **Orbital Vector**:
- **Formula:** `Vector = (Solar_Degree, Earth_Degree, Cycle_Count)`
- **Solar_Degree (θ_solar):** 0° to 360° (24-hour day). 1° = 1 **Arc** (4 mins).
- **Earth_Degree (θ_earth):** 0° to 360° (365.24-day year).
- **Cycle_Count:** Full orbits since Birth Signature (Epoch).

## 3. Geometry & Visualization (SVG Layer)
- **Inner Track (Solar):** Radius `r=36`. Daily fluctuations (HRV, Heart Rate).
- **Outer Track (Earth):** Radius `r=46`. Macro trends (Weight, BTC, Seasons).
- **The Tether:** Every data point MUST render a line connecting θ_earth to θ_solar.
- **Normalisation:** Data (0.0 - 1.0) determines **Radial Offset** (High = outward, Low = inward).
- **Collision:** If markers overlap within **2.5°**, apply `.colliding` CSS class.

## 4. The 4-Phase Besearch Cycle (Bento Workspace)
| Phase | Bento Quadrant | Action |
| :--- | :--- | :--- |
| **1. Context** | **Now-Peer** | Anchor inquiry to a specific Arc/Biomarker. |
| **2. Research** | **Now-Network** | Ingest External AI (Perplexity/ii) & Ledger data. |
| **3. Exploration**| **Future-Peer** | Use **Emulator** to test "Candidate Vectors." |
| **4. Synthesis** | **Future-Network**| Detect **Consilience** & hash to Ledger. |

## 5. The Resonance Engine & Goldilocks Zones
Truth is found through **Angular Collision Detection** within **Harmony Bands** (Ω).
- **Deficiency:** Data falls inside the inner radius of the Ω band.
- **Overshoot:** Data pushes outside the outer radius of the Ω band.
- **Consilience:** Achieved when Peer, Network, and Great Orbit wedges all occupy their respective Sweet Spots at the same Arc.

## 6. Model Evolution (The Emulation Layer)
- **Seed to Fidelity:** Models start as low-res "Seeds" (e.g., generic 4-chamber heart).
- **Physics-Informed ML:** Data logged at specific θ coordinates "carves" the geometry (e.g., HRV at 180° adjusts heart valve conductivity).
- **Feedback Loops:** Use 'Ghost Anchors' to compare emulated states against real-world sensor captures.

## 7. Implementation Rules
- **Language:** Vanilla JavaScript (Strictly No TypeScript).
- **Engine:** Use `HeliCore` WASM for all degree calculations.
- **Context Pattern:** Systems access modules via `dataAPI.context` (e.g., `context.heliclock`).

## 8. Peer Contexts & Use Cases (The Emulation North Star)
The HOP protocol is designed to fulfill specific high-fidelity use cases stored in the `bentoboxds` ecosystem. These define the "Target Resonance" for the Emulator.

- **Primary Reference:** [BentoBox-DS Peer Cases](https://github.com/healthscience/bentoboxds/tree/main/plans/peercases)
- **The Four Pillars:**
    1. **Metabolic Peer:** [Emulating biological homeostasis.](https://github.com/healthscience/bentoboxds/blob/main/plans/peercases/metabolic_peer.md)
    2. **Ecological Peer:** [Aligning bioregional river/soil health.](https://github.com/healthscience/bentoboxds/blob/main/plans/peercases/ecological_peer.md)
    3. **Economic Peer:** [Mapping value-flow resonance.](https://github.com/healthscience/bentoboxds/blob/main/plans/peercases/economic_peer.md)
    4. **Consilience Peer:** [The synthesis of all three orbits.](https://github.com/healthscience/bentoboxds/blob/main/plans/peercases/consilience_peer.md)

*Note: The Resonance Engine must use these MDs to calibrate the "Goldilocks Zones" ($r_{min}$ to $r_{max}$) for each unique peer type.*