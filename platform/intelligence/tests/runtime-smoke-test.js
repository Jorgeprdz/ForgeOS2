import { runtime } from "../runtime/bootstrap.js";
import { IntelligenceRequest } from "../contracts/IntelligenceRequest.js";

const result = await runtime.execute(
  new IntelligenceRequest({
    message: "Bootstrap Online",
    metadata: {
      intent: "alfred"
    }
  })
);

console.log(JSON.stringify(result, null, 2));
