import React from 'react';

const componentStyle = {
    block: {
        display: 'flex',
    },
}

export const Block = ({ children, className = '', style = null }) => {
    return <div className={ className } style={ style ?? componentStyle.block }>{ children }</div>;
};

Block.stylize = (style: {
    frame?: true;
    horGap?: true;
    horPad?: true;
    verGap?: true;
    verPad?: true;
    style?: any;
}) => {
    const s = style.style;
    let set = false;

    for (const key of Object.keys(style)) {
        if (style[key] && key !== 'style') {
            style[key] = key;
            set = true;
        } else {
            delete style[key];
        }
    }

    const inlineClassName = set ? Object.values({ padding: 'padding', ...style }).join(' ') : '';

    return (props) => <Block className={ inlineClassName } style={ s } { ...props } />;
}

export type Elem = (props: any) => any;

Block.H = Block.stylize({ horGap: true });
Block.V = Block.stylize({ verGap: true });
Block.F = Block.stylize({ frame: true }) as Elem & { H: Elem, V: Elem, F: Elem };
Block.F.H = Block.stylize({ horGap: true, frame: true });
Block.F.V = Block.stylize({ verGap: true, frame: true });
Block.F.F = Block.stylize({ frame: true });
