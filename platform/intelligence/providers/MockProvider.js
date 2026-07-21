export class MockProvider {

  async generate({ request, context }) {
    return {
      provider: "mock",
      output: `Mock response: ${request.message}`,
      contextReceived: !!context
    };
  }

}
