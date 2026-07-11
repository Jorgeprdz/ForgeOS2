// Browser-safe subset from retirement-presentation-scenario-engine.js.
const BLOCKED_NO_VERIFIED_UDI_RATE = "BLOCKED_NO_VERIFIED_UDI_RATE";
const SCENARIO_LABEL = "SCENARIO_BASED_ESTIMATE_NOT_GUARANTEED";

async function browserUnavailableRateProvider() {
  return null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function convertUdiToMxn(value, currentUdiValue) {
  const number = numberOrNull(value);
  return number === null ? null : number * currentUdiValue;
}

export async function getVerifiedUdiRateMetadata({
  rateProvider = browserUnavailableRateProvider
} = {}) {
  try {
    const cache = await rateProvider();
    const udi = cache?.rates?.UDI_MXN;
    const currentUdiValue = Number(udi?.value || 0);

    if (!currentUdiValue) {
      return {
        status: BLOCKED_NO_VERIFIED_UDI_RATE,
        currentUdiValue: null,
        source: null,
        sourceDate: null,
        sourceMode: null,
        cacheStatus: cache?.cacheStatus || null
      };
    }

    return {
      status: "VERIFIED_UDI_RATE_AVAILABLE",
      currentUdiValue,
      source: udi.source,
      sourceDate: udi.date,
      sourceMode: cache.cacheStatus === "CACHE_HIT" ? "CACHE" : "LIVE",
      cacheStatus: cache.cacheStatus,
      seriesId: udi.seriesId,
      title: udi.title
    };
  } catch (error) {
    return {
      status: BLOCKED_NO_VERIFIED_UDI_RATE,
      currentUdiValue: null,
      source: null,
      sourceDate: null,
      sourceMode: null,
      cacheStatus: null,
      error: error.message
    };
  }
}

export function calculateTotalContributed({
  totalAnnualPremium = 0,
  premiumPayingYears = 0,
} = {}) {
  const annualPremium = Number(totalAnnualPremium);
  const payingYears = Number(premiumPayingYears);
  if (!Number.isFinite(annualPremium) || annualPremium < 0) {
    throw new TypeError("totalAnnualPremium must be a finite non-negative number");
  }
  if (!Number.isFinite(payingYears) || payingYears < 0) {
    throw new TypeError("premiumPayingYears must be a finite non-negative number");
  }
  return annualPremium * payingYears;
}

export function buildRetirementPresentationScenario({
  parsedQuote = {},
  udiRateMetadata = {}
}) {
  const currentUdiValue = Number(udiRateMetadata.currentUdiValue || 0);

  if (!currentUdiValue) {
    return {
      status: BLOCKED_NO_VERIFIED_UDI_RATE,
      reason: "Retirement MXN scenario requires verified UDI rate metadata.",
      productName: parsedQuote.productName,
      currency: parsedQuote.currency,
      currentUdiValue: null,
      source: null,
      sourceDate: null,
      sourceMode: null,
      calculationMode: SCENARIO_LABEL
    };
  }

  const base = parsedQuote.scenarios?.base;

  if (!base?.monthlyIncome || !base?.lumpSum) {
    return {
      status: "BLOCKED_NO_RETIREMENT_SCENARIO_EVIDENCE",
      reason: "Retirement scenario values must come from extracted/source evidence.",
      productName: parsedQuote.productName,
      currency: parsedQuote.currency,
      currentUdiValue,
      source: udiRateMetadata.source,
      sourceDate: udiRateMetadata.sourceDate,
      sourceMode: udiRateMetadata.sourceMode,
      calculationMode: SCENARIO_LABEL
    };
  }

  const monthlyIncome = numberOrNull(base.monthlyIncome);
  const premium = parsedQuote.premiumStructure || {};
  const totalContributed = calculateTotalContributed(premium);

  return {
    status: "READY",
    productName: parsedQuote.productName,
    currency: parsedQuote.currency,
    currentUdiValue,
    source: udiRateMetadata.source,
    sourceDate: udiRateMetadata.sourceDate,
    sourceMode: udiRateMetadata.sourceMode,
    cacheStatus: udiRateMetadata.cacheStatus,
    calculationMode: SCENARIO_LABEL,
    summary: {
      currentAge: parsedQuote.currentAge,
      retirementAge: parsedQuote.retirementAge,
      coverageYears: parsedQuote.coverageYears,
      premiumPayingYears: premium.premiumPayingYears,
      paidUntilAge: premium.paidUntilAge,
      basicAnnualPremiumUDI: premium.basicAnnualPremium,
      basicAnnualPremiumMXN: convertUdiToMxn(premium.basicAnnualPremium, currentUdiValue),
      plannedAnnualContributionUDI: premium.plannedAnnualContribution,
      plannedAnnualContributionMXN: convertUdiToMxn(premium.plannedAnnualContribution, currentUdiValue),
      totalAnnualPremiumUDI: premium.totalAnnualPremium,
      totalAnnualPremiumMXN: convertUdiToMxn(premium.totalAnnualPremium, currentUdiValue),
      totalContributedUDI: totalContributed,
      totalContributedMXN: totalContributed * currentUdiValue,
      lumpSumUDI: base.lumpSum,
      lumpSumMXN: convertUdiToMxn(base.lumpSum, currentUdiValue),
      monthlyIncomeUDI: monthlyIncome,
      monthlyIncomeMXN: convertUdiToMxn(monthlyIncome, currentUdiValue),
      calculationMode: SCENARIO_LABEL,
      currencySource: {
        currentUdiValue,
        source: udiRateMetadata.source,
        sourceDate: udiRateMetadata.sourceDate,
        sourceMode: udiRateMetadata.sourceMode
      }
    }
  };
}

const api=Object.freeze({calculateTotalContributed,getVerifiedUdiRateMetadata,buildRetirementPresentationScenario});
globalThis.ForgeQuoteCalculators=api;
if(typeof globalThis.dispatchEvent==="function"&&typeof globalThis.CustomEvent==="function"){globalThis.dispatchEvent(new CustomEvent("forge:quote-calculators-ready",{detail:api}));}
