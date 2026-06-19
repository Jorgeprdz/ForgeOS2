function getSupabaseBanxicoRatesUrl() {
  return process.env.SUPABASE_BANXICO_RATES_URL;
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY;
}

function assertNoTokenLikeSecretInMessage(message) {
  if (/[a-f0-9]{64}/i.test(String(message))) {
    throw new Error("Provider error attempted to expose token-like value");
  }
}

function normalizeSupabaseBanxicoRatesResponse(payload) {
  if (!payload || payload.ok !== true) {
    throw new Error("Invalid Supabase Banxico response: ok must be true");
  }

  const udi = payload?.rates?.UDI_MXN;
  const usdFix = payload?.rates?.USD_MXN_FIX;

  if (!udi || !usdFix) {
    throw new Error("Invalid Supabase Banxico response: missing UDI_MXN or USD_MXN_FIX");
  }

  for (const [key, rate] of Object.entries({ UDI_MXN: udi, USD_MXN_FIX: usdFix })) {
    if (rate.source !== "BANXICO_SIE_API") {
      throw new Error(`Invalid Supabase Banxico response: ${key} source must be BANXICO_SIE_API`);
    }

    if (typeof rate.value !== "number" || Number.isNaN(rate.value)) {
      throw new Error(`Invalid Supabase Banxico response: ${key} value must be numeric`);
    }
  }

  return {
    UDI_MXN: udi,
    USD_MXN_FIX: usdFix
  };
}

async function getCurrentRatesFromSupabaseEdge({ fetchImpl = globalThis.fetch } = {}) {
  const url = getSupabaseBanxicoRatesUrl();

  if (!url) {
    throw new Error("Missing SUPABASE_BANXICO_RATES_URL. Configure the Banxico Edge Function endpoint.");
  }

  if (typeof fetchImpl !== "function") {
    throw new Error("Missing fetch implementation for Supabase Banxico Edge provider.");
  }

  const anonKey = getSupabaseAnonKey();

  const headers = {
    Accept: "application/json"
  };

  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  const response = await fetchImpl(url, {
    method: "GET",
    headers
  });

  const text = await response.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Supabase Banxico Edge returned non-JSON response with status ${response.status}`);
  }

  if (!response.ok || payload?.ok === false) {
    const errorMessage = payload?.error || `Supabase Banxico Edge request failed with status ${response.status}`;
    assertNoTokenLikeSecretInMessage(errorMessage);
    throw new Error(errorMessage);
  }

  return normalizeSupabaseBanxicoRatesResponse(payload);
}

module.exports = {
  getCurrentRatesFromSupabaseEdge,
  normalizeSupabaseBanxicoRatesResponse
};
