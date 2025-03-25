import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';
import { BaseStore } from './base-store';

let nextId = 0;

export class AlertsStore extends BaseStore {
  @observable alerts: {
    id?: number | string;
    isShowing?: boolean;
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

      for (const alert of this.alerts) {
        if (now - alert.timestamp > 15000) {
          alert.isShowing = false;
        }
      }
    }, 500);
  }

  close(alert: typeof AlertsStore.prototype['alerts'][0]) {
    this.alerts.find((a) => a === alert)!.isShowing = false;
  }

  dispose(): void {
    this.alerts = [];

    clearInterval(this.cleanAlertsTimer);
  }

  push(message: React.Component | React.FunctionComponent | { level: string, value: string } | string, id?: number | string) {
    if (id && this.alerts.some((alert) => alert.id === id)) {
      return;
    }

    this.alerts.unshift({
      id: id ?? nextId ++,
      isShowing: true,
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

  onTransitionEnd(alert: typeof AlertsStore.prototype['alerts'][0]) {
    if (!alert.isShowing) {
      this.alerts = this.alerts.filter((a) => a !== alert);
    }
  }
}
