import { BaseProvider } from "./BaseProvider.js";

export class MockProvider extends BaseProvider {

  constructor() {
    super("mock");
  }

  async generate({ request, context }) {

    return {
      provider: this.name,
      output: `Mock response: ${request.message}`,
      contextReceived: !!context
    };

  }

}
