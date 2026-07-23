const TOKEN_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export class CarrierScopeError extends TypeError {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CarrierScopeError';
    this.code = 'INVALID_CARRIER_SCOPE';
    this.details = Object.freeze({ ...details });
  }
}

function normalizeToken(value, field) {
  if (typeof value !== 'string') {
    throw new CarrierScopeError(`${field} must be a string`, {
      field,
      receivedType: typeof value
    });
  }

  const normalized = value.trim().toLowerCase();

  if (!TOKEN_PATTERN.test(normalized)) {
    throw new CarrierScopeError(`${field} must use lowercase kebab-case`, {
      field,
      value
    });
  }

  return normalized;
}

export function createCarrierScope(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CarrierScopeError('carrier scope input must be an object');
  }

  const carrier = normalizeToken(input.carrier, 'carrier');
  const market = normalizeToken(input.market, 'market');
  const productLine = input.productLine == null
    ? null
    : normalizeToken(input.productLine, 'productLine');

  return Object.freeze({
    kind: 'carrier-scope',
    version: 1,
    carrier,
    market,
    productLine,
    canonical: productLine
      ? `${carrier}:${market}:${productLine}`
      : `${carrier}:${market}`
  });
}

export function assertCarrierScope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CarrierScopeError('carrier scope must be an object');
  }

  const expected = createCarrierScope(value);

  for (const key of ['kind', 'version', 'carrier', 'market', 'productLine', 'canonical']) {
    if (value[key] !== expected[key]) {
      throw new CarrierScopeError(`carrier scope ${key} mismatch`, {
        key,
        expected: expected[key],
        received: value[key]
      });
    }
  }

  return value;
}

export function isCarrierScope(value) {
  try {
    assertCarrierScope(value);
    return true;
  } catch {
    return false;
  }
}
