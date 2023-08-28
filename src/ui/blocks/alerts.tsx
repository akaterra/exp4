import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { AlertsStore } from '../stores/alerts';

export const alertsStore = new AlertsStore();

export const Alerts = observer(({ store }: { store: AlertsStore }) => {
  return <div className="overlay1">
    <div className='flex h-100'>
      <div className='c14 c10-m- c-4-s- clear'></div>
      <div className='c-4 c-8-m- c14-s- clear h-100'>
        <div className='paragraph paragraph-lrg' style={ { alignItems: 'end' } }>
          {
            store.alerts.map((alert) => {
              return <div className='c18 children-gap'>
                <div className='panel failure unbound shadow shadow-sml'>{ alert.messageComponent }</div>
              </div>;
            })
          }
        </div>
      </div>
    </div>
  </div>;
});

export const GlobalAlerts = () => {
  return <Alerts store={ alertsStore } />;
}
