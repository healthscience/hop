# BeeBee Upgrade Plan

This document outlines the plan for upgrading the `beebee` component of the Health Oracle Protocol (HOP).

## Prerequisites (Must Read Before Implementation)
Before beginning any implementation, the following resources **must** be consulted in this specific order to ensure alignment with the core architecture and design philosophy:
1. **`plans/AGENT_OPENING_PROMPT.md`**: This document outlines the Prime Directive, the 4-Phase Besearch Cycle, and critical engineering constraints (e.g., eliminating Linear Drift, using Orbital Geometry).
2. **`plans/GENERAL_SPEC_HOP.md`** (or `plans/SPEC_HOP.md`): This document details the Health Oracle Protocol's core logic, including the Orbital Vector, SVG Layer geometry, and the Resonance Engine's Goldilocks Zones.
3. **Task-Specific Markdown**: Any markdown file specific to the current task being implemented.
4. **Flow Diagrams (`plans/flowdiagrams/`)**: Review the architectural flow diagrams for HOP and BentoBoxDS (e.g., `BEEBEE_RESONAGENT_NEAT.mmd`, `BENTOBOXDS_TOOLS.mmd`) to understand the intended data flow and component interactions.

## Phase 1: The Three C's (Capacity, Context, Coherence) & Prompt Stitcher
Implement a Prompt Stitcher and Message Router to transform Natural Language input into structured Context, Capacity, and Coherence data using a Two-Stage Prompt Architecture (`[MASTER SYSTEM PROMPT] + [TASK-SPECIFIC WRAPPER] + [USER CONTEXT] = [STRUCTURED REPLY]`).

**Note:** The core logic for this phase will be implemented in the `beebee-ai` repository (`../bbAI`), with integration updates made here in `hop-ecs`.

*   **Sub-goal 1.1 (Prompt Storage - `beebee-ai` repo):** Create `prompts.js` to store the XML strings for the Master Prompt (Identity) and Task Prompts (Extraction & Routing).
*   **Sub-goal 1.2 (Stitcher Service - `beebee-ai` repo):** Implement `stitcher.js` to combine the Master Prompt, Task Prompt, and User Context into a single string.
*   **Sub-goal 1.3 (Message Handler - `beebee-ai` repo):** Implement `handler.js` (or update `beebeeFlow` in `src/index.js`) to process the stitched prompt via the LLM. It must detect Tool Routing tags (e.g., `[[MEDICAL]]`) and route to specialized agents if necessary.
*   **Sub-goal 1.4 (Parsing & Extraction - `beebee-ai` repo):** Build regex parsers to extract the clean text response and parse the `<ui_data>` JSON block (containing the Three C's keywords) from the LLM's raw output.
*   **Sub-goal 1.5 (Error Handling - `beebee-ai` repo):** Implement fallback logic to return a default "Neutral" lens state if the LLM fails to provide valid JSON, preventing UI breakage.
*   **Sub-goal 1.6 (Integration - `hop-ecs` repo):** Update `src/bbai/index.js` in `hop-ecs` to route incoming natural language messages (from BentoBoxDS `inputBox.vue`) to the updated `beebee-ai` package and ensure the Egress flow returns the standardized JSON payload back to the frontend.
*   **Sub-goal 1.7 (Testing):** Write unit tests in both repositories to validate the prompt stitching, regex parsing, routing logic, and integration.

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
