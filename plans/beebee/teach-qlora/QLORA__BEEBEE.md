Refinery Agent Skill: Local QLoRA & CUE Contracts
🎯 Purpose

This skill governs the "Refinery"—the local-first training module of BentoBoxDS. It enables the agent to architect a local QLoRA training loop that bridges WASM (Data/Logic) and WebGPU (Compute) without relying on cloud-based "AI Magic."
🛠️ Tech Stack Constraints

    Runtime: Browser-based (WASM + WebGPU).

    Data Vault: sqlite-wasm for persisting chat history and context.

    Training Engine: Custom WebGPU Compute Shaders for backpropagation on LoRA adapters.

    Logic Layer: Rust (Candle) compiled to WASM for tensor manipulation and CUE validation.

    Contracting: All training parameters must be validated against TrainingSchema.cue.

🧬 Architectural Patterns
1. The "Split-Brain" Training Loop

Do NOT attempt full PyTorch-style training in WASM. Use this hybrid flow:

    WASM (The Manager): Loads the 4-bit quantized base model. Extracts "Zero-Draft" training pairs from SQLite.

    WebGPU (The Worker): Receives the A and B LoRA matrices. Executes the forward/backward pass in shaders.

    WASM (The Vault): Receives updated weights, validates them via CUE, and saves the .adapter file to the local file system.

2. The 400IM "Stroke" Context

Map training intensity to the Life-Strap "Stroke":

    Fly (High Rank): r=16,α=32. Used for complex new concept learning.

    Back (Low Rank): r=4,α=8. Used for subtle tone/habit calibration.

📋 Example Implementation Task

    Agent Goal: Implement the resonAgent trigger for the @teach command.

Step 1: Define the Cue Contract (.cue)
Code snippet

#QLoRAConfig: {
    target_modules: ["q_proj", "v_proj"]
    rank: int & >0 & <=64
    alpha: int & >0
    learning_rate: float & >0 & <0.001
    epochs: int & >=1 & <=5
}

Step 2: The WebGPU Shader (Partial Example)
Code snippet

// WGSL fragment for weight update
@compute @workgroup_size(64)
fn update_weights(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    let grad = gradients[index];
    weights[index] -= learning_rate * grad; // Simplified SGD step
}

🚫 Critical Don'ts

    Don't use standard JS Math.random for weight initialization; use a seeded WASM RNG for reproducibility.

    Don't block the main UI thread. All training logic MUST run in a Worker (WASM) or ComputePass (WebGPU).

    Don't assume the presence of a discrete GPU. Always include a fallback for integrated graphics (limit rank to r=4).

🔄 The "Besearch" Integration

When a user uploads a research paper, the agent must:

    Extract key entities to Besearch.db.

    Generate a "Synthetic Prompt" for the 1B model.

    Trigger a "Micro-Refine" (QLoRA) session to bake that paper's knowledge into the current Life-Strap adapter.