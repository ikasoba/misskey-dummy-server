export class Pinger {
  private lastPinged?: number;
  private isHealthy = false;
  public onStatusChanged = new Set<((isHealthy: boolean) => void)>();
  public onStatusHealthy = new Set<() => void>();

  constructor(private host: string) {}

  healthy(): Promise<boolean> {
    if (this.lastPinged == null) return this.checkHealthy();

    const diff = Date.now() - this.lastPinged;
    if (diff > 1000 * 60 * 30) {
      return this.checkHealthy();
    }

    return Promise.resolve(this.isHealthy);
  }

  checkHealthy(): Promise<boolean> {
    return this.fetch(this.host).then(() => this.isHealthy).catch(() =>
      this.isHealthy
    );
  }

  fetch(...args: Parameters<typeof fetch>) {
    const prevStatus = this.isHealthy;
    return fetch(...args).then((x) => {
      this.lastPinged = Date.now();
      this.isHealthy = true;
      if (x.status >= 500 && x.status <= 599) {
        this.isHealthy = false;
      }
      return x;
    }).catch((err) => {
      this.lastPinged = Date.now();
      this.isHealthy = false;

      throw err;
    }).finally(() => {
      if (prevStatus != this.isHealthy) {
        console.info("[pinger]", this.isHealthy ? "healthy" : "unavailable");
        for (const fn of this.onStatusChanged) {
          fn(this.isHealthy);
        }

        if (this.isHealthy) {
          for (const fn of this.onStatusHealthy) {
            fn();
          }
        }
      }
    });
  }
}
