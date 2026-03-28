export class MockHeaders {
  private store = new Map<string, string>();

  constructor(init?: Record<string, string>) {
    Object.entries(init ?? {}).forEach(([k, v]) =>
      this.store.set(k.toLowerCase(), String(v)),
    );
  }

  get(key: string) {
    return this.store.get(key.toLowerCase()) ?? null;
  }

  set(key: string, value: string) {
    this.store.set(key.toLowerCase(), String(value));
  }

  delete(key: string) {
    this.store.delete(key.toLowerCase());
  }

  forEach(fn: (value: string, key: string) => void) {
    this.store.forEach((value, key) => fn(value, key));
  }
}
