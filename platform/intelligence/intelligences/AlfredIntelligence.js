import { IntelligenceResult } from "../contracts/IntelligenceResult.js";
import { ProviderRequest } from "../contracts/ProviderRequest.js";

export class AlfredIntelligence {

  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  async execute({ request, context }) {

    const provider = this.providerManager.getDefault();

    const providerRequest = new ProviderRequest({
      prompt: request.message,
      context,
      metadata: request.metadata ?? {}
    });

    const response = await provider.generate(providerRequest);

    return new IntelligenceResult({
      intelligence: "alfred",
      intent: request.metadata?.intent ?? "general",
      confidence: 1,
      facts: [],
      recommendations: [],
      actions: [],
      warnings: [],
      draft: response.output,
      humanApprovalRequired: false,
      fallbackUsed: false,
      evidenceIds: []
    });

  }

}
