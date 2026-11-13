import { OmniAgent } from "../src/agent.js";
import { TOOLS } from "../src/tools.js";

async function runTests() {
  console.log("\n=======================================================");
  console.log(" 🧪 OmniAgent Test Suite: Unit & Integration Verification");
  console.log("=======================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
    }
  }

  // Test 1: Math Engine
  const calcResult = await TOOLS.calculate.execute({ expression: "(10 * 5) + 50" });
  assert(calcResult.success && calcResult.result === 100, "Math calculation evaluated correctly");

  // Test 2: Safe Math Expression Sanitization
  const badMath = await TOOLS.calculate.execute({ expression: "process.exit(1)" });
  assert(!badMath.success || badMath.result === undefined, "Unsafe script execution sanitized safely");

  // Test 3: Vector Similarity Grounding
  const vectorResult = await TOOLS.vector_match.execute({
    query: "dense vector RAG model",
    candidates: [
      "DocDigitize runs on-device dense vector embeddings using all-MiniLM-L6-v2.",
      "Cooking recipes with garlic and olive oil.",
      "Basketball scores and tournament standings."
    ]
  });
  assert(
    vectorResult.success && vectorResult.matches[0].index === 0 && vectorResult.matches[0].score > 0.2,
    "Vector similarity accurately ranks relevant document first"
  );

  // Test 4: Schema Compliance Validator
  const schemaPass = await TOOLS.validate_schema.execute({
    record: { studentId: "MUT/ENG/2022/8841", amountPaid: 45000, status: "APPROVED" },
    requiredKeys: ["studentId", "amountPaid", "status"]
  });
  assert(schemaPass.compliant === true, "Schema compliance validator passes on complete record");

  const schemaFail = await TOOLS.validate_schema.execute({
    record: { studentId: "MUT/ENG/2022/8841" },
    requiredKeys: ["studentId", "amountPaid", "status"]
  });
  assert(schemaFail.compliant === false && schemaFail.missingFields.length === 2, "Schema validator catches missing keys");

  // Test 5: End-to-End ReAct Agent Convergence
  const agent = new OmniAgent({ maxIterations: 4 });
  const agentExecution = await agent.run("Find information about dense vector RAG and calculate 100 + 250");
  assert(agentExecution.success === true, "Agent converges to FINISH state within iteration budget");
  assert(agentExecution.iterations <= 4, "Agent respects iteration ceiling");

  console.log("\n-------------------------------------------------------");
  console.log(`Results: ${passed}/${total} tests passed successfully.`);
  console.log("-------------------------------------------------------\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
