import { ForgeIntelligenceRuntime } from "../runtime/ForgeIntelligenceRuntime.js";
import { IntelligenceRegistry } from "../registry/IntelligenceRegistry.js";
import { IntelligenceRouter } from "../router/IntelligenceRouter.js";
import { ContextBuilder } from "../context/ContextBuilder.js";
import { AuthorityGate } from "../authority/AuthorityGate.js";
import { EchoIntelligence } from "../intelligences/EchoIntelligence.js";
import { IntelligenceRequest } from "../contracts/IntelligenceRequest.js";

const registry = new IntelligenceRegistry();
registry.register("echo", new EchoIntelligence());
registry.register("default", new EchoIntelligence());

const runtime = new ForgeIntelligenceRuntime({
  registry,
  router: new IntelligenceRouter(registry),
  contextBuilder: new ContextBuilder(),
  authorityGate: new AuthorityGate()
});

const result = await runtime.execute(
  new IntelligenceRequest({
    message: "Forge Runtime Online",
    metadata: {
      intent: "echo"
    }
  })
);

console.log(JSON.stringify(result, null, 2));
