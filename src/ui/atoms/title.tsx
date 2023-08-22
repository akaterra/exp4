import React from 'react';
import { C } from './grid';

export const SubSubTitle = ({ x = null, children, style = undefined }) => {
    const control = <div className='caption smallest' style={ style }>{ children }</div>;

    if (x !== null) {
        return <C x={ x }>{ control }</C>;
    }

    return control;
};

export const SubTitle = ({ x = null, children, style = undefined }) => {
    const control = <div className='caption smaller' style={ style }>{ children }</div>;

    if (x !== null) {
        return <C x={ x }>{ control }</C>;
    }

    return control;
};

export const Title = ({ x = null, children, style = undefined }) => {
    const control = <div className='caption' style={ style }>{ children }</div>;

    if (x !== null) {
        return <C x={ x }>{ control }</C>;
    }

    return control;
};
