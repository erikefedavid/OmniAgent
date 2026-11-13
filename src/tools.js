/**
 * Tool Registry for OmniAgent
 */

export const TOOLS = {
  // 1. Math & Statistics Engine
  calculate: {
    name: "calculate",
    description: "Evaluates mathematical expressions and statistical aggregations.",
    execute: async ({ expression }) => {
      try {
        // Safe math evaluation
        const sanitized = expression.replace(/[^0-9+\-*/().Math,\s]/g, "");
        const result = Function(`"use strict"; return (${sanitized})`)();
        return { success: true, result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },

  // 2. Telemetry & Web Ingestion Engine
  fetch_url_telemetry: {
    name: "fetch_url_telemetry",
    description: "Fetches live webpage status, latency, headers, and metadata.",
    execute: async ({ url }) => {
      try {
        const start = Date.now();
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000) });
        const latency = Date.now() - start;
        return {
          success: true,
          status: res.status,
          latencyMs: latency,
          contentType: res.headers.get("content-type"),
          server: res.headers.get("server") || "unknown"
        };
      } catch (err) {
        return { success: false, error: `Failed to probe ${url}: ${err.message}` };
      }
    }
  },

  // 3. Dense Vector Similarity & Grounding Tool
  vector_match: {
    name: "vector_match",
    description: "Calculates cosine similarity between a query and a set of candidate passages.",
    execute: async ({ query, candidates }) => {
      // Enhanced token-frequency vector matching
      const tokenize = (text) => (text.toLowerCase().match(/\b\w+\b/g) || []);
      const qTokens = tokenize(query);
      const qSet = new Set(qTokens);

      const scored = candidates.map((cand, idx) => {
        const cTokens = tokenize(cand);
        let matches = 0;
        for (const token of cTokens) {
          if (qSet.has(token)) matches++;
        }
        const denom = Math.sqrt((qTokens.length || 1) * (cTokens.length || 1));
        const score = matches / denom;
        return { index: idx, passage: cand, score: Number(score.toFixed(4)) };
      });

      scored.sort((a, b) => b.score - a.score);
      return { success: true, matches: scored.slice(0, 3) };
    }
  },

  // 4. Compliance & Integrity Validator
  validate_schema: {
    name: "validate_schema",
    description: "Validates a structured record against expected compliance schemas.",
    execute: async ({ record, requiredKeys }) => {
      const missing = requiredKeys.filter(k => record[k] === undefined || record[k] === null || record[k] === "");
      return {
        success: missing.length === 0,
        missingFields: missing,
        compliant: missing.length === 0
      };
    }
  }
};
