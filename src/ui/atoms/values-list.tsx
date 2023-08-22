// import { h, render } from 'preact';
// import { Button } from './button';
// import { Input } from './input';
// import { Label } from "./label";
// import { getStyleByGrid } from "./grid";
// import { useEffect, useState } from "preact/compat";

// export const componentStyle = {
//     container: {
//         display: 'inline-block',
//         // margin: '-4px 8px 0 -4px',
//         margin: '2px',
//     },
//     control: {
//         backgroundColor: 'transparent',
//         // border: '2px solid #ff8080',
//         // borderRadius: '4px',
//         color: '#ff8080',
//         // cursor: 'pointer',
//         fontSize: 'inherit',
//         fontWeight: 'bold',
//         // height: '2em',
//         // minHeight: '2em',
//         width: '10em',
//     },
//     controlLabel: {
//         paddingLeft: '4px',
//     },
// };

// export const ValuesList = ({ items, editable = false, label = null, uniq = false, x = 3, onChange = null, containerStyle = null, style = null }) => {
//     const [ currentItems, setCurrentItems ] = useState(items ?? []);
//     const [ currentValue, setCurrentValue ] = useState('');

//     useEffect(() => {
//         if (!Array.isArray(items) && !(items && typeof items === 'object')) {
//             items = [];
//         }

//         setCurrentItems(items);
//     }, [ items ]);

//     const control = Array.isArray(currentItems)
//         ? <ul
//             style={ style ?? componentStyle.control }
//         >{ currentItems.map((e) => <li>{ e }</li>) }</ul>
//         : <ul
//             style={ style ?? componentStyle.control }
//         >{ Object.entries<string>(currentItems ?? {}).map(([optionKey, optionVal]) => <li>{ optionKey }</li>) }</ul>;

//     if (!containerStyle) {
//         containerStyle = getStyleByGrid(x, componentStyle.container);
//     }

//     let addValueDisabled = !currentValue;

//     if (!addValueDisabled && uniq) {
//         if (Array.isArray(currentItems)) {
//             if (currentItems.includes(currentValue)) {
//                 addValueDisabled = true;
//             }
//         } else {
//             if (currentValue in currentItems) {
//                 addValueDisabled = true;
//             }
//         }
//     }

//     const editControl = editable
//         ? (
//           <div>
//             <Input currentValue={ currentValue } onChange={ setCurrentValue } />
//             <Button disabled={ addValueDisabled } x={ 1 } onClick={ () => {
//                 const nextItems = Array.isArray(currentItems)
//                   ? currentItems.concat([ currentValue ])
//                   : { ...currentItems, [ currentValue ]: true };

//                 setCurrentItems(nextItems);
//                 setCurrentValue('');

//                 if (onChange) {
//                     onChange(nextItems);
//                 }
//             } }>+</Button>
//           </div>
//         )
//         : null;

//     if (!label) {
//         return <div style={ containerStyle }>{ control }{ editControl }</div>;
//     }

//     return <div style={ containerStyle }>
//         <Label style={ componentStyle.controlLabel }>{ label }</Label>
//         { control }
//         { editControl }
//     </div>;
// }
