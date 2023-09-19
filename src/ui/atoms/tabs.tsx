import * as React from 'react';
import { C } from "./grid";
import { Fragment, useEffect, useState } from 'react';
import { Row } from './row';
import { NavLink } from './link';

export const Tabs = ({ children = null, decoration = undefined, onlyTabs = false, onlyChild = false, selectedIndex = 0, tabs, tabsDecoration = undefined, onSelect = undefined }: any) => {
  const [ currentSelectedIndex, setCurrentSelectedIndex ] = useState(
    typeof selectedIndex === 'number'
    ? selectedIndex
    : tabs.findIndex((tab) => tab.id === selectedIndex) ?? 0
  );
  const child = Array.isArray(children) ? children[currentSelectedIndex] : children;

  useEffect(() => {
    setCurrentSelectedIndex(currentSelectedIndex);
  }, [ currentSelectedIndex ?? 0 ]);

  return <Fragment>
    {
      !onlyChild
        ? <Row>
          <C>
            <div className={ `tabs underlined ${decoration ?? ''}` }>
              <div className='tabs-bar'>
                {
                  tabs.map((tab, i) => {
                    if (tab && typeof tab === 'object') {
                      let Component: any;
                      let props;

                      switch (tab.type) {
                      case 'link':
                        Component = NavLink;
                        props = { href: tab.href };
                        break;
                      }

                      if (Component) {
                        return <Component className={ i.toString() === String(currentSelectedIndex) ? `tab active ${tabsDecoration}` : `tab ${tabsDecoration}` } onClick={ () => {
                          setCurrentSelectedIndex(i);
      
                          if (onSelect) {
                            onSelect(i);
                          }
                        } } { ...props }>{ tab.title }</Component>;
                      }
                    }

                    return <button className={ i.toString() === String(currentSelectedIndex) ? `tab active ${tabsDecoration}` : `tab ${tabsDecoration}` } onClick={ () => {
                      setCurrentSelectedIndex(i);
  
                      if (onSelect) {
                        onSelect(i);
                      }
                    } }>{ tab }</button>;
                  })
                }
              </div>
              <div className='tabs-content underlined' />
            </div>
          </C>
        </Row>
        : null
    }
    { !onlyTabs ? child : null }
  </Fragment>;
}
