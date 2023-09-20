import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { AlertsStore } from '../stores/alerts';
import { Loader } from '../atoms/loader';
import { Button } from '../atoms/button';

const style: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  bottom: 0,
  zIndex: 50000,
};

export const alertsStore = new AlertsStore();

export const Alerts = observer(({ store }: { store: AlertsStore }) => {
  return <div style={ style }>
    <Loader isShown={ store.isShown } />
    <div className='row clear'>
      <div className='paragraph paragraph-lrg' style={ { alignItems: 'end' } }>
        {
          store.alerts.map((alert, i) => {
            const level = alert.message?.level ?? 'failure';
            const message = alert.message?.value ?? alert.message;

            return <div className='f-4 f-8-m- f14-s-' key={ i }>
              <div className={ `alert ${level} unbound shadow shadow-sml flex flex-hor flex-middle` }>
                <div className='row flex-hor flex-middle'>
                  <div className='ccc'>{ message }</div>
                  <Button className={ `button-sml ${level} no-margin` } x='ccc w-auto' onClick={ () => store.close(alert) }>✖</Button>
                </div>
              </div>
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
