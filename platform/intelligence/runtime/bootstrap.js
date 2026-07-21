import { ForgeIntelligenceRuntime } from "./ForgeIntelligenceRuntime.js";

import { IntelligenceRegistry } from "../registry/IntelligenceRegistry.js";
import { IntelligenceRouter } from "../router/IntelligenceRouter.js";

import { ContextBuilder } from "../context/ContextBuilder.js";
import { AuthorityGate } from "../authority/AuthorityGate.js";

import { ProviderManager } from "../providers/ProviderManager.js";
import { MockProvider } from "../providers/MockProvider.js";

import { AlfredIntelligence } from "../intelligences/AlfredIntelligence.js";

export const providerManager = new ProviderManager();
providerManager.register("mock", new MockProvider());

export const registry = new IntelligenceRegistry();

registry.register(
  "default",
  new AlfredIntelligence(providerManager)
);

registry.register(
  "alfred",
  new AlfredIntelligence(providerManager)
);

export const router = new IntelligenceRouter(registry);

export const contextBuilder = new ContextBuilder();

export const authorityGate = new AuthorityGate();

export const runtime = new ForgeIntelligenceRuntime({
  registry,
  router,
  contextBuilder,
  authorityGate
});
