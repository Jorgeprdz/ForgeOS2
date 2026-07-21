import { IntelligenceResult } from "../contracts/IntelligenceResult.js";

export class AlfredIntelligence {

  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  async execute({ request, context }) {

    const provider = this.providerManager.getDefault();

    const response = await provider.generate({
      request,
      context
    });

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
