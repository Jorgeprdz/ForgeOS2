export class BaseProvider {

  constructor(name) {
    this.name = name;
  }

  async generate() {
    throw new Error(
      `${this.constructor.name}.generate() must be implemented`
    );
  }

}
