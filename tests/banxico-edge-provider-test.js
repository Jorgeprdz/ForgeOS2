const assert = require("node:assert/strict");
const {
  getCurrentRatesFromSupabaseEdge,
  normalizeSupabaseBanxicoRatesResponse
} = require("../shared-banxico-edge-provider");

const VALID_RESPONSE = {
  ok: true,
  cachedAt: "2026-06-19T00:32:25.856Z",
  rates: {
    UDI_MXN: {
      seriesId: "SP68257",
      title: "Valor de UDIS",
      date: "25/06/2026",
      value: 8.81842,
      source: "BANXICO_SIE_API",
      mode: "LATEST_VERIFIED"
    },
    USD_MXN_FIX: {
      seriesId: "SF43718",
      title: "Tipo de cambio FIX",
      date: "18/06/2026",
      value: 17.3688,
      source: "BANXICO_SIE_API",
      mode: "LATEST_VERIFIED"
    }
  }
};

async function run() {
  console.log("\nFORGE BANXICO EDGE PROVIDER TEST\n");

  const originalUrl = process.env.SUPABASE_BANXICO_RATES_URL;
  const originalAnonKey = process.env.SUPABASE_ANON_KEY;
  const originalBanxicoToken = process.env.BANXICO_TOKEN;

  try {
    delete process.env.SUPABASE_BANXICO_RATES_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.BANXICO_TOKEN;

    await assert.rejects(
      () => getCurrentRatesFromSupabaseEdge({ fetchImpl: async () => ({}) }),
      /Missing SUPABASE_BANXICO_RATES_URL/
    );
    console.log("PASS missing SUPABASE_BANXICO_RATES_URL fails clearly");

    process.env.SUPABASE_BANXICO_RATES_URL = "https://example.supabase.co/functions/v1/banxico-rates";

    let fetchCalled = false;
    const rates = await getCurrentRatesFromSupabaseEdge({
      fetchImpl: async (url, options) => {
        fetchCalled = true;

        assert.equal(url, process.env.SUPABASE_BANXICO_RATES_URL);
        assert.equal(options.method, "GET");
        assert.equal(options.headers.Accept, "application/json");
        assert.equal(options.headers.Authorization, undefined);
        assert.equal(options.headers.apikey, undefined);

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(VALID_RESPONSE)
        };
      }
    });

    assert.equal(fetchCalled, true);
    assert.equal(rates.UDI_MXN.value, 8.81842);
    assert.equal(rates.USD_MXN_FIX.value, 17.3688);
    assert.equal(rates.UDI_MXN.source, "BANXICO_SIE_API");
    assert.equal(rates.USD_MXN_FIX.source, "BANXICO_SIE_API");
    console.log("PASS valid Supabase Edge response returns normalized rates");

    process.env.SUPABASE_ANON_KEY = "public-anon-key";

    await getCurrentRatesFromSupabaseEdge({
      fetchImpl: async (_url, options) => {
        assert.equal(options.headers.apikey, "public-anon-key");
        assert.equal(options.headers.Authorization, "Bearer public-anon-key");

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(VALID_RESPONSE)
        };
      }
    });
    console.log("PASS anon key is used when provided");

    assert.throws(
      () => normalizeSupabaseBanxicoRatesResponse({ ok: true, rates: {} }),
      /missing UDI_MXN or USD_MXN_FIX/
    );
    console.log("PASS invalid response without rates blocks");

    assert.throws(
      () => normalizeSupabaseBanxicoRatesResponse({
        ok: true,
        rates: {
          UDI_MXN: { ...VALID_RESPONSE.rates.UDI_MXN, source: "OTHER_SOURCE" },
          USD_MXN_FIX: VALID_RESPONSE.rates.USD_MXN_FIX
        }
      }),
      /source must be BANXICO_SIE_API/
    );
    console.log("PASS invalid source blocks");

    assert.throws(
      () => normalizeSupabaseBanxicoRatesResponse({
        ok: true,
        rates: {
          UDI_MXN: { ...VALID_RESPONSE.rates.UDI_MXN, value: "8.8" },
          USD_MXN_FIX: VALID_RESPONSE.rates.USD_MXN_FIX
        }
      }),
      /value must be numeric/
    );
    console.log("PASS non-numeric rate value blocks");

    process.env.BANXICO_TOKEN = "this-should-not-be-used-by-edge-provider";

    await getCurrentRatesFromSupabaseEdge({
      fetchImpl: async (_url, options) => {
        assert(!("Bmx-Token" in options.headers), "Edge provider must not send Bmx-Token");
        assert(!("BANXICO_TOKEN" in options.headers), "Edge provider must not send BANXICO_TOKEN");

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(VALID_RESPONSE)
        };
      }
    });
    console.log("PASS provider does not require or send BANXICO_TOKEN");

    await assert.rejects(
      () => getCurrentRatesFromSupabaseEdge({
        fetchImpl: async () => ({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ ok: false, error: "Edge failed safely" })
        })
      }),
      /Edge failed safely/
    );
    console.log("PASS Edge error propagates without secrets");

    console.log("\nSummary: 8 tests, 8 passed, 0 failed.");
  } finally {
    if (originalUrl === undefined) {
      delete process.env.SUPABASE_BANXICO_RATES_URL;
    } else {
      process.env.SUPABASE_BANXICO_RATES_URL = originalUrl;
    }

    if (originalAnonKey === undefined) {
      delete process.env.SUPABASE_ANON_KEY;
    } else {
      process.env.SUPABASE_ANON_KEY = originalAnonKey;
    }

    if (originalBanxicoToken === undefined) {
      delete process.env.BANXICO_TOKEN;
    } else {
      process.env.BANXICO_TOKEN = originalBanxicoToken;
    }
  }
}

run().catch((error) => {
  console.error("\nFAIL BANXICO EDGE PROVIDER TEST");
  console.error(error);
  process.exit(1);
});
