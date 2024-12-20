import * as React from 'react';
import { C } from "./grid";
import { Fragment, useEffect, useState } from 'react';
import { Row } from './row';
import { NavLink } from './link';

export type Tab = string | { id: string, title: string, type?: 'link', href?: string };

export type TabOnSelect = (index: number, tab: Tab) => void;

export const Tabs = ({ children = null, decoration = undefined, onlyTabs = false, onlyChild = false, selectedIndex = 0, tabs, tabsDecoration = undefined, onSelect = undefined }: any & { tabs?: Tab[]; onSelect?: TabOnSelect; }) => {
  const tabIndex = typeof selectedIndex === 'number'
    ? selectedIndex
    : tabs.findIndex((tab) => tab.id === selectedIndex);
  const [ currentSelectedIndex, setCurrentSelectedIndex ] = useState(tabIndex >= 0 ? tabIndex : 0);
  const child = Array.isArray(children) ? children[currentSelectedIndex] : children;

  useEffect(() => {
    setCurrentSelectedIndex(tabIndex);
  }, [ tabIndex ]);

  return <Fragment>
    {
      !onlyChild
        ? <Row>
          <C>
            <div className={ `tabs underlined ${decoration ?? ''}` }>
              <div className='tabs-bar'>
                {
                  tabs.map((tab, i) => {
                    const isSelected = i.toString() === String(currentSelectedIndex);
                    let tabTitle = tab;
                    let tabId = tab;

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
                        return <Component className={ isSelected ? `tab active ${tabsDecoration}` : `tab ${tabsDecoration}` } onClick={ () => {
                          setCurrentSelectedIndex(i);
      
                          if (onSelect) {
                            onSelect(i, tab.id);
                          }
                        } } { ...props }>{ tab.title }</Component>;
                      }

                      tabTitle = tab.title;
                      tabId = tab.id;
                    }

                    return <button className={ i.toString() === String(currentSelectedIndex) ? `tab active ${tabsDecoration}` : `tab ${tabsDecoration}` } onClick={ () => {
                      setCurrentSelectedIndex(i);
  
                      if (onSelect) {
                        onSelect(i, tabId);
                      }
                    } }>{ tabTitle }</button>;
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
