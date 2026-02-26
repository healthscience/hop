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
*   **Sub-goal 1.1:** Identify the exact message routing logic where a `life-strap` is created (likely in `src/bbai/index.js` or `src/library/index.js`).
*   **Sub-goal 1.2:** Create specific system prompts designed to extract Capacity, Context, and Coherence from natural language input.
*   **Sub-goal 1.3:** Implement logic within `beebee` to process the peer's input against these prompts and return a structured set of keywords for each of the Three C categories.
*   **Sub-goal 1.4:** Write unit tests to validate the accurate extraction of Capacity, Context, and Coherence keywords from diverse peer inputs.

## Phase 2: WASM Agents (`resonAgents` and `neat-hop`)
Introduce two new WASM implementations to handle specialized tasks.
*   **Sub-goal 2.1:** Add `resonAgents` and `neat-hop` as dependencies and implement the WASM initialization logic in `src/index.js`. This will follow the same pattern used for `hop-crypto` and `heliclock-hop` (handling both Node.js buffer loading and Browser initialization).
*   **Sub-goal 2.2:** Update `beebee`'s routing logic to manage the lifecycle, coordination, and task assignment for these new agents.
*   **Sub-goal 2.3:** Implement a translation mechanism within `beebee` to interpret the raw outputs of the tiny agents and convert them into natural language or structured data that the peer can understand.
*   **Sub-goal 2.4:** Write unit tests for the initialization, task assignment, and output translation of `resonAgents` and `neat-hop`.
*   **Sub-goal 2.5:** Write unit tests to verify the feedback loops that drive the evolution of the tiny agents (NEAT topology updates).

## Phase 3: Node-Safeflow and the Consilience Weave
Integrate the upgraded `node-safeflow` (ES6 pipelines) and implement the consilience weave.
*   **Sub-goal 3.1:** Update HOP's integration with `node-safeflow` to utilize its new ES6 pipeline structure.
*   **Sub-goal 3.2:** Implement the core logic for the "consilience weave" within the safeflow routing.
*   **Sub-goal 3.3:** Update `beebee` to act as the orchestrator, managing the cascade of flows required by the consilience weave.
*   **Sub-goal 3.4:** Write unit tests for `beebee`'s orchestration of the flow cascade and the execution of ES6 pipelines in `node-safeflow`.

## Phase 4: End-to-End Testing (HOP and BentoBoxDS)
A comprehensive testing suite must be developed to ensure the reliability of the new architecture.
*   **Sub-goal 4.1:** Develop tests to verify the correct structure and routing of messages between BentoBoxDS, HOP, and `beebee`.
*   **Sub-goal 4.2:** Develop tests to ensure messages within HOP and `beebee` are correctly dispatched to sub-components (e.g., `safeflow`, `resonAgents`).
*   **Sub-goal 4.3:** Develop tests to ensure time-series data is correctly converted to Orbital Vectors and that the Resonance Engine accurately identifies Goldilocks Zones and Consilience.

## Phase 5: Self-Evolution (qLoRA)
Enable `beebee` to update its own weights over time.
*   **Sub-goal 5.1:** Design a mechanism to collect and format training data based on peer interactions and agent feedback.
*   **Sub-goal 5.2:** Implement the logic for `beebee` to perform qLoRA weight updates, allowing it to learn and adapt to the peer's specific needs.
