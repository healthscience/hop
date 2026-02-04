# HOP & BentoBoxDS Testing Strategy

## Philosophy: Testing the Nervous System
We are not just testing code; we are testing a "Digital Organism".
- **HOP (Backend):** Tests the **Reflexes**. Does the Context pass signals? Do Systems fire correctly?
- **BentoBoxDS (Frontend):** Tests the **Behavior**. Does the UI reflect the internal state? Can the user interact with the organism?
- **Resonance (System):** Tests the **Harmony**. Does the system detect geometric alignment with the Orbit?

## 1. Agent-Led Automated Testing
Agents can and should run these tests.

### HOP (Unit & Integration)
*   **Tool:** Vitest
*   **Command:** `npm test` (in `hop/` or `besearch-hop/`)
*   **Agent Role:** Run tests after every refactor. Analyze stack traces. Fix broken "reflexes".

### BentoBoxDS (End-to-End)
*   **Tool:** Cypress
*   **Command:** `npx cypress run` (in `bentoboxds/`)
*   **Agent Role:** Run specific specs (e.g., `besearch.cy.js`) to verify user flows.

## 2. The New Layer: Resonance Testing
Standard tests check if `2 + 2 = 4`. Resonance tests check if `Angle A == Angle B`.

### Concept: The "Year in a Second"
We need a test harness that mocks `HeliClock` to speed up time.
1.  **Setup:** Create a `ResonanceTestSystem`.
2.  **Input:** Feed two data streams:
    *   Stream A: Event at `45°` Solar Longitude.
    *   Stream B: Event at `45.5°` Solar Longitude.
3.  **Execution:** Fast-forward `HeliClock` through the year.
4.  **Assertion:** Verify that `SafeFlow` triggered a "Resonance Event" (Collision) because `|A - B| < 1°`.

### Implementation Plan
*   Create `test/resonance.test.js` in `besearch-hop`.
*   Use the new **Context Pattern** to inject a `MockHeliClock`.
*   Verify that `Besearch` or `SafeFlow` detects the alignment.

## 3. Continuous Integration (CI) for Agents
When you ask an agent to "Refactor X", the agent should automatically:
1.  **Plan:** Review architecture.
2.  **Code:** Implement changes.
3.  **Verify:** Run `npm test`.
4.  **Refine:** Fix any regressions.

## 4. Multi-Process Testing Environment
To test the full organism, agents can manage multiple terminals simultaneously:

1.  **Terminal A (The Heart):** Start the HOP Backend.
    ```bash
    cd hop-ecs
    npm run start -- --storename test-hop-storage
    ```
    *Agent waits for: "listening on *:3000"*

2.  **Terminal B (The Body):** Start the BentoBoxDS Frontend.
    ```bash
    cd bentoboxds
    npm run dev
    ```
    *Agent waits for: "Vite vX.X.X ready in X ms"*

3.  **Terminal C (The Observer):** Run the Test Suite.
    ```bash
    cd bentoboxds
    npx cypress run
    ```

This setup ensures that the E2E tests run against a live, breathing HOP node.
