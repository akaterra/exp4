import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { AlertsStore } from '../stores/alerts';

const style: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  bottom: 0,
  zIndex: 2000,
};

export const alertsStore = new AlertsStore();

export const Alerts = observer(({ store }: { store: AlertsStore }) => {
  return <div style={ style }>
    <div className='row clear'>
      <div className='paragraph paragraph-lrg' style={ { alignItems: 'end' } }>
        {
          store.alerts.map((alert) => {
            return <div className='f-4 f-8-m- f14-s-'>
              <div className='alert failure unbound shadow shadow-sml'>{ alert.messageComponent }</div>
            </div>;
          })
        }
      </div>
    </div>
  </div>;
});

export const GlobalAlerts = () => {
  return <Alerts store={ alertsStore } />;
}
