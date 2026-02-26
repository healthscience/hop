# BeeBee Upgrade Plan

This document outlines the plan for upgrading the `beebee` component of the Health Oracle Protocol (HOP).

## Prerequisites (Must Read Before Implementation)
Before beginning any implementation, the following resources **must** be consulted in this specific order to ensure alignment with the core architecture and design philosophy:
1. **`plans/AGENT_OPENING_PROMPT.md`**: This document outlines the Prime Directive, the 4-Phase Besearch Cycle, and critical engineering constraints (e.g., eliminating Linear Drift, using Orbital Geometry).
2. **`plans/GENERAL_SPEC_HOP.md`** (or `plans/SPEC_HOP.md`): This document details the Health Oracle Protocol's core logic, including the Orbital Vector, SVG Layer geometry, and the Resonance Engine's Goldilocks Zones.
3. **Task-Specific Markdown**: Any markdown file specific to the current task being implemented.
4. **Flow Diagrams (`plans/flowdiagrams/`)**: Review the architectural flow diagrams for HOP and BentoBoxDS (e.g., `BEEBEE_RESONAGENT_NEAT.mmd`, `BENTOBOXDS_TOOLS.mmd`) to understand the intended data flow and component interactions.

## Phase 1: The Three C's (Capacity, Context, Coherence)
When a `life-strap` is created, we need to extract the Three C's from the peer's input.

1. **Identify Entry Point:** Locate the exact message routing logic where a `life-strap` is created (likely in `src/bbai/index.js` or `src/library/index.js`).
2. **System Prompts:** Create specific system prompts designed to extract Capacity, Context, and Coherence from natural language input.
3. **Keyword Extraction:** Implement logic within `beebee` to process the peer's input against these prompts and return a structured set of keywords for each of the Three C categories.

## Phase 2: WASM Agents (`resonAgents` and `neat-hop`)
Introduce two new WASM implementations to handle specialized tasks.

1. **Integration:** Add `resonAgents` and `neat-hop` as dependencies or load their WASM modules during the HOP initialization process (similar to `hop-crypto`).
2. **Agent Management:** Update `beebee`'s routing logic to manage the lifecycle, coordination, and task assignment for these new agents.
3. **Translation Layer:** Implement a translation mechanism within `beebee` to interpret the raw outputs of the tiny agents and convert them into natural language or structured data that the peer can understand.

## Phase 3: Self-Evolution (qLoRA)
Enable `beebee` to update its own weights over time.

1. **Data Collection:** Design a mechanism to collect and format training data based on peer interactions and agent feedback.
2. **qLoRA Implementation:** Implement the logic for `beebee` to perform qLoRA weight updates, allowing it to learn and adapt to the peer's specific needs.

## Phase 4: Node-Safeflow and the Consilience Weave
Integrate the upgraded `node-safeflow` (ES6 pipelines) and implement the consilience weave.

1. **Pipeline Integration:** Update HOP's integration with `node-safeflow` to utilize its new ES6 pipeline structure.
2. **Consilience Weave Logic:** Implement the core logic for the "consilience weave" within the safeflow routing.
3. **Flow Management:** Update `beebee` to act as the orchestrator, managing the cascade of flows required by the consilience weave.
