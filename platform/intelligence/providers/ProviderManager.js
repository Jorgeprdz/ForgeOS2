export class ProviderManager {

  constructor() {
    this.providers = new Map();
  }

  register(name, provider) {
    
if (typeof provider.generate !== "function") {
throw new Error("Invalid provider");
}
this.providers.set(name, provider);

  }

  get(name) {
    return this.providers.get(name);
  }

  getDefault() {
    return this.providers.values().next().value;
  }

  list() {
    return [...this.providers.keys()];
  }

}
