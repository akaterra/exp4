import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';
import { BaseStore } from './base-store';

export class AlertsStore extends BaseStore {
  @observable alerts: {
    message: React.Component | React.FunctionComponent | { level: string, value: string } | string;
    timestamp: number;
  }[] = [];
  @observable isLoaderShownIteration: number = 0;

  private cleanAlertsTimer: NodeJS.Timeout;

  @computed
  get isShown() {
    return this.isLoaderShownIteration > 0;
  }

  constructor() {
    super();
    makeObservable(this);

    this.cleanAlertsTimer = setInterval(() => {
      const now = Date.now();

      this.alerts = this.alerts.length
        ? this.alerts.filter((alert) => now - alert.timestamp < 15000)
        : this.alerts;
    }, 500);
  }

  close(alert: typeof AlertsStore.prototype['alerts'][0]) {
    this.alerts = this.alerts.filter((a) => a !== alert);
  }

  dispose(): void {
    clearInterval(this.cleanAlertsTimer);
  }

  push(message: React.Component | React.FunctionComponent | { level: string, value: string } | string) {
    this.alerts.push({
      message,
      timestamp: Date.now(),
    });
  }

  showLoader() {
    this.isLoaderShownIteration += 1;
  }

  hideLoader() {
    this.isLoaderShownIteration = this.isLoaderShownIteration > 0 ? this.isLoaderShownIteration - 1 : 0;
  }
}
