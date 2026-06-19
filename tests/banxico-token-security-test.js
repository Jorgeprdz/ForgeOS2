const assert = require("node:assert/strict");
const { getCurrentRates } = require("../shared-banxico-rate-engine");

async function run() {
  console.log("\nFORGE BANXICO TOKEN SECURITY TEST\n");

  const originalToken = process.env.BANXICO_TOKEN;

  try {
    delete process.env.BANXICO_TOKEN;

    await assert.rejects(
      () => getCurrentRates(),
      (error) => {
        assert.equal(
          error.message,
          "Missing BANXICO_TOKEN. Configure it as an environment variable or Supabase Edge Function secret."
        );

        assert(!/[a-f0-9]{64}/i.test(error.message), "Error must not expose token-like values");
        assert(!error.message.includes("Bmx-Token"), "Error must not expose Banxico header details");

        return true;
      }
    );

    console.log("PASS missing BANXICO_TOKEN fails clearly before network use");
    console.log("PASS error does not expose token-like values");
    console.log("\nSummary: 2 tests, 2 passed, 0 failed.");
  } finally {
    if (originalToken === undefined) {
      delete process.env.BANXICO_TOKEN;
    } else {
      process.env.BANXICO_TOKEN = originalToken;
    }
  }
}

run().catch((error) => {
  console.error("\nFAIL BANXICO TOKEN SECURITY TEST");
  console.error(error);
  process.exit(1);
});
