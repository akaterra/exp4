import React from 'react';
import { Label } from "./label";
import { C, getStyleByGrid } from "./grid";
import { Fragment, useEffect, useState } from 'react';
import { Row } from './row';

export const Tabs = ({ children = null, decoration = undefined, onlyTabs = false, onlyChild = false, selectedIndex = 0, tabs, tabsDecoration = undefined, onSelect = undefined, style = undefined }: any) => {
    const [ currentSelectedIndex, setCurrentSelectedIndex ] = useState(selectedIndex ?? 0);
    const child = Array.isArray(children) ? children[currentSelectedIndex] : children;

    useEffect(() => {
        setCurrentSelectedIndex(selectedIndex);
    }, [ selectedIndex ?? 0 ]);

    return <Fragment>
        {
            !onlyChild
                ? <Row>
                    <C>
                        <div className={ `tabs underlined ${decoration ?? ''}` }>
                            <div className='tabs-bar'>
                                {
                                    tabs.map((tab, i) => <div className={ i.toString() === String(currentSelectedIndex) ? `tab active ${tabsDecoration}` : `tab ${tabsDecoration}` } onClick={ () => {
                                        setCurrentSelectedIndex(i);

                                        if (onSelect) {
                                            onSelect(i);
                                        }
                                    } }>{ tab }</div>)
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
