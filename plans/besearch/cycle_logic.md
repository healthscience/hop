# Besearch Cycle Logic (N=1)

## Overview
The Besearch cycle is a 4-stage process that drives the scientific inquiry and computation within HOP. It is triggered by the HeliClock and managed by the `besearch-hop` module.

## The 4 Stages

### 1. Context (Sovereign Data Set)
*   **Goal:** Establish the data context for the cycle.
*   **Input:** Peer's sovereign data (e.g., Heart Rate, Activity).
*   **Action:** Validate data availability and quality.
*   **Transition:** Moves to Stage 2 when data is confirmed.

### 2. Research (Ground in what is known)
*   **Goal:** Link the data to existing knowledge.
*   **Input:** Reference Contracts from `library-hop`.
*   **Action:** Identify relevant research, markers, and protocols.
*   **Transition:** Moves to Stage 3 when research context is established.

### 3. Search (Explore space of outcomes / interventions)
*   **Goal:** Perform computation to explore possibilities.
*   **Input:** Data + Research Context.
*   **Action:** Trigger `SafeFlow` to execute the NXP's compute module (DML).
*   **Transition:** Moves to Stage 4 when compute results are available.

### 4. Emulation (Model Simulation to Decide now)
*   **Goal:** Make a decision or prediction based on the search.
*   **Input:** Compute Results.
*   **Action:** Run emulation models (Prediction).
*   **Transition:** Cycle completes or loops back to Stage 1 for continuous monitoring.

## HeliClock Integration
*   The cycle is driven by "Orbital Vectors" from the HeliClock.
*   Specific vectors (time points) can trigger stage transitions or new cycles.

## Data Structure
*   Cycles are stored in `Hyperbee`.
*   Each cycle record contains:
    *   `id`: Unique ID.
    *   `name`: Cycle name.
    *   `description`: Description.
    *   `category`: prevention, repair, rejuvenation, etc.
    *   `nxpId`: Network Experiment ID.
    *   `computeContractId`: Selected computation contract.
    *   `marker`: Selected marker.
    *   `stage`: Current stage (1-4).
    *   `context`: Data context.
    *   `startTime`: Timestamp.
    *   `vector`: HeliClock vector.
    *   `active`: Boolean status.
    *   `linkedInterventions`: Array of linked intervention IDs.
