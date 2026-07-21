import { IntelligenceRegistry } from "../registry/IntelligenceRegistry.js";
import { AlfredIntelligence } from "../intelligences/AlfredIntelligence.js";

export const registry = new IntelligenceRegistry();

registry.register("default", new AlfredIntelligence());
registry.register("alfred", new AlfredIntelligence());
