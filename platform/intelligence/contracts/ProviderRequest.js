export class ProviderRequest {

  constructor({
    prompt = "",
    context = {},
    metadata = {},
    options = {}
  } = {}) {

    this.prompt = prompt;
    this.context = context;
    this.metadata = metadata;
    this.options = options;

    Object.freeze(this);
  }

}
