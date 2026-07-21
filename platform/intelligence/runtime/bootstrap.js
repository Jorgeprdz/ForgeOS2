import { IntelligenceRegistry } from "../registry/IntelligenceRegistry.js";
import { AlfredIntelligence } from "../intelligences/AlfredIntelligence.js";

import { ProviderManager } from "../providers/ProviderManager.js";
import { MockProvider } from "../providers/MockProvider.js";

export const providerManager = new ProviderManager();
providerManager.register("mock", new MockProvider());

export const registry = new IntelligenceRegistry();

registry.register("default", new AlfredIntelligence());
registry.register("alfred", new AlfredIntelligence());
