REFINERY_HOP_ORCHESTRATOR.md
🎯 Strategic Intent

To build a Prompt Stitcher and Message Router within the HOP (Health Oracle Protocol) framework. This system takes Natural Language input and transforms it into structured Context, Capacity, and Coherence data for the BentoBoxDS UI using a 1B-parameter model.
🏗️ 1. The Two-Stage Prompt Architecture

The 1B model requires strict boundaries. We use a Stacking Strategy:
[MASTER SYSTEM PROMPT] + [TASK-SPECIFIC WRAPPER] + [USER CONTEXT] = [STRUCTURED REPLY]
A. The Master Prompt (Identity)
XML

<system_identity>
Role: Beebee, the BentoBoxDS Guide.
Core Function: Extract Context, Capacity, and Coherence variables to initialize Besearch Cycles. 
Mindset: Natural Language First, Zero-Draft Mode.
Tone: Supportive, concise, minimalist.
Constraint: Never hallucinate. If unknown, say "I cannot help." 
</system_identity>
B. The Task Prompt (Extraction & Routing)
XML

<task_instruction>
1. Identify keywords for the Three-C Lenses:
   - Capacity: Performance/Energy goals.
   - Context: Environment/Tools/Data.
   - Coherence: Friction/Balance/Recovery.
2. If the user requires external data, trigger a ROUTE:
   - [[MEDICAL]]: Symptoms, skin, health (Route to ii.inc).
   - [[PRODUCT]]: Buying, specs, chemicals (Route to Perplexity).
   - [[RESEARCH]]: PubMed, papers, deep science (Route to Besearch).
3. Output a supportive reply followed by a JSON block in <ui_data> tags.
</task_instruction>

🔄 2. HOP Message Flow & Routing

Kilo must implement the following flow across the BentoBoxDS ↔ HOP bridge:

    Ingress: inputBox.vue sends raw text to hop/beebee-ai.

    Synthesis: The Orchestrator.js fetches the MASTER_PROMPT and attaches the CONTEXT_EXTRACTION task.

    Inference: The 1B Model processes the stitched XML string.

    Parsing:

        Text: Extracted from the response body (clean of XML).

        UI Data: Parsed from <ui_data>{...}</ui_data>.

        Route: Detected via the [[TAG]] pattern.

    Egress: Returns a standardized JSON payload to the BentoBoxDS frontend.

💻 3. Implementation Code (Reference for Kilo)
The Stitcher Service (hop/services/beebee-ai/stitcher.js)
JavaScript

export const stitchPrompt = (userInput, task = 'CONTEXT_EXTRACTION') => {
  return `
    ${MASTER_PROMPT}
    ${TASK_PROMPTS[task]}
    <user_context>${userInput}</user_context>
    <response_guidance>Provide Clean Text followed by <ui_data>JSON</ui_data></response_guidance>
  `.trim();
};

The Message Handler (hop/services/beebee-ai/handler.js)
JavaScript

export async function processMessage(payload) {
  const prompt = stitchPrompt(payload.text);
  const rawResponse = await llmClient.generate(prompt);

  // Logic to detect Tool Routing
  const targetAgent = rawResponse.match(/\[\[(.*?)\]\]/)?.[1];
  
  if (targetAgent) {
    // Hand-off logic to specialized HOP agents (Perplexity/ii.inc)
    return routeToSpecialist(targetAgent, payload.text);
  }

  return {
    text: stripXML(rawResponse),
    lens: parseUIData(rawResponse)
  };
}

📋 Kilo Coding Instructions

    File Creation: Create hop/services/beebee-ai/prompts.js to store the XML strings.

    Logic Implementation: Build the regex parsers for <ui_data> and [[TAG]].

    Frontend Hook: Update the DialoguePanel.vue to react to the lens object by updating the three-column visual display.

    Error Handling: If the 1B model fails to provide valid JSON, fallback to a default "Neutral" lens state rather than breaking the UI.