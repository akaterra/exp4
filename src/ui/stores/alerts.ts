import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';
import { BaseStore } from './base-store';

export class AlertsStore extends BaseStore {
  @observable alerts: {
    messageComponent: React.Component | React.FunctionComponent | string;
    timestamp: number;
  }[] = [];

  private cleanAlertsTimer: NodeJS.Timeout;

  constructor() {
    super();
    makeObservable(this);

    this.cleanAlertsTimer = setInterval(() => {
      const now = Date.now();

      this.alerts = this.alerts.filter((alert) => alert.timestamp - now >= 5000);
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
}
