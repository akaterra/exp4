import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';
import { BaseStore } from './base-store';

export class AlertsStore extends BaseStore {
  @observable alerts: {
    messageComponent: React.Component | React.FunctionComponent | string;
    timestamp: number;
  }[] = [];
  @observable isLoaderShownIteration: number = 0;

  private cleanAlertsTimer: NodeJS.Timeout;

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

  dispose(): void {
    clearInterval(this.cleanAlertsTimer);
  }

  push(messageComponent: React.Component | React.FunctionComponent | string) {
    this.alerts.push({
      messageComponent,
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
