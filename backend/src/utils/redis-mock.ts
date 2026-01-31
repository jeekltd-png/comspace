export class RedisMock {
  private store = new Map<string, string>();
  private timers = new Map<string, NodeJS.Timeout>();
  public ready = true;

  async connect(): Promise<void> {
    // noop for mock
    this.ready = true;
  }

  async quit(): Promise<void> {
    // clear timers
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.store.clear();
    this.ready = false;
  }

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key) as string : null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<'OK'> {
    this.store.set(key, value);
    if (this.timers.has(key)) clearTimeout(this.timers.get(key)!);
    const t = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttlSeconds * 1000);
    this.timers.set(key, t);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key) ? 1 : 0;
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    return existed;
  }

  // expose a simple setex alias for compatibility
  async setex(key: string, ttlSeconds: number, value: string): Promise<'OK'> {
    return this.setEx(key, ttlSeconds, value);
  }
}