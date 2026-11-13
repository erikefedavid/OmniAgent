import { OmniAgent } from "./agent.js";

async function main() {
  console.log("\n=======================================================");
  console.log(" 🤖 OmniAgent: Autonomous Problem-Solving Agent");
  console.log("=======================================================\n");

  const agent = new OmniAgent();

  // Test Goal: Multi-step telemetry probing + mathematical calculation
  const goal = "Probe https://daviderikefe.vercel.app telemetry and calculate 2500 * 4 * 18 / 60";
  const result = await agent.run(goal);

  console.log("\n-------------------------------------------------------");
  console.log(`Execution Success: ${result.success}`);
  console.log(`Total Iterations: ${result.iterations}`);
  console.log(`Final Result: ${result.result}`);
  console.log("-------------------------------------------------------\n");
}

main().catch(console.error);
