import { TOOLS } from "./tools.js";

/**
 * Autonomous ReAct (Reasoning + Acting) Agent Engine
 */
export class OmniAgent {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 6;
    this.memory = [];
  }

  log(message) {
    console.log(`[OmniAgent] ${message}`);
  }

  /**
   * Run the agent toward solving a complex goal
   */
  async run(goal, context = {}) {
    this.log(`Initiating goal: "${goal}"`);
    this.memory.push({ role: "system", content: `Goal: ${goal}` });

    let iteration = 0;
    let completed = false;
    let finalAnswer = null;

    while (iteration < this.maxIterations && !completed) {
      iteration++;
      this.log(`Iteration ${iteration}/${this.maxIterations}`);

      // 1. Autonomous Planning & Reasoning Step
      const plan = this.planNextAction(goal, context, this.memory);
      this.log(`Thought: ${plan.thought}`);

      if (plan.action === "FINISH") {
        completed = true;
        finalAnswer = plan.actionInput;
        this.log(`Resolved objective: ${finalAnswer}`);
        break;
      }

      // 2. Action Step (Invoke Tool)
      const tool = TOOLS[plan.action];
      if (!tool) {
        this.log(`Error: Unknown tool "${plan.action}". Adjusting strategy.`);
        this.memory.push({ role: "observation", content: `Tool ${plan.action} not found.` });
        continue;
      }

      this.log(`Executing tool: ${plan.action} with input: ${JSON.stringify(plan.actionInput)}`);
      const observation = await tool.execute(plan.actionInput);
      this.log(`Observation: ${JSON.stringify(observation)}`);

      // 3. Store Observation in Scratchpad Memory
      this.memory.push({
        iteration,
        thought: plan.thought,
        action: plan.action,
        input: plan.actionInput,
        observation
      });

      // Update context dynamically with observation
      context[`last_result_${iteration}`] = observation;
    }

    return {
      success: completed,
      iterations: iteration,
      result: finalAnswer,
      trace: this.memory
    };
  }

  /**
   * Deterministic Decision & Planning Matrix
   */
  planNextAction(goal, context, memory) {
    const goalLower = goal.toLowerCase();

    // Check if goal involves website/telemetry inspection
    if (goalLower.includes("probe") || goalLower.includes("ping") || goalLower.includes("telemetry") || goalLower.includes("status")) {
      const hasProbed = memory.some(m => m.action === "fetch_url_telemetry");
      if (!hasProbed) {
        const urlMatch = goal.match(/https?:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : (context.url || "https://daviderikefe.vercel.app");
        return {
          thought: `I need to probe the network telemetry and latency for ${url}.`,
          action: "fetch_url_telemetry",
          actionInput: { url }
        };
      }
    }

    // Check if goal involves mathematical estimation or ROI
    if (goalLower.includes("calculate") || goalLower.includes("roi") || goalLower.includes("hours saved")) {
      const hasCalculated = memory.some(m => m.action === "calculate");
      if (!hasCalculated) {
        const expr = context.expression || "2500 * 4 * 18 / 60";
        return {
          thought: `Calculating mathematical metric using expression: ${expr}.`,
          action: "calculate",
          actionInput: { expression: expr }
        };
      }
    }

    // Check if goal involves semantic vector passage search
    if (goalLower.includes("search") || goalLower.includes("match") || goalLower.includes("find")) {
      const hasMatched = memory.some(m => m.action === "vector_match");
      if (!hasMatched) {
        return {
          thought: "Executing semantic vector similarity matching against candidate corpus.",
          action: "vector_match",
          actionInput: {
            query: goal,
            candidates: context.passages || [
              "DocDigitize runs on-device dense vector embeddings using all-MiniLM-L6-v2.",
              "GitSentry prevents layout thrashing by blocking height and width animations.",
              "devradar monitors tech boards and dispatches Telegram notifications."
            ]
          }
        };
      }
    }

    // Final synthesis step
    const observations = memory.filter(m => m.observation);
    return {
      thought: "All required tool observations collected. Synthesizing final answer.",
      action: "FINISH",
      actionInput: `Completed objective successfully with ${observations.length} autonomous tool executions.`
    };
  }
}
