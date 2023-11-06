export class Pinger {
  private lastPinged?: number;
  private isHealthy = false;

  constructor(private host: string) {}

  healthy(): Promise<boolean> {
    if (this.lastPinged == null) return this.checkHealthy();

    const diff = Date.now() - this.lastPinged;
    if (diff > 1000 * 60 * 60 * 6) {
      return this.checkHealthy();
    }

    return Promise.resolve(this.isHealthy);
  }

  checkHealthy(): Promise<boolean> {
    return fetch(this.host).then((x) => {
      this.lastPinged = Date.now();
      return this.isHealthy = x.ok;
    }).catch(() => {
      this.lastPinged = Date.now();
      return this.isHealthy = false;
    }).finally(() => {
      console.info("[pinger]", this.isHealthy ? "healthy" : "unavailable");
    });
  }
}
