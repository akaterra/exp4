// import { h, render } from 'preact';
// import { withLinkedObserving } from "../hocs/with-observing";

// const componentStyle = {
//     control: {
//         backgroundColor: 'white',
//         filter: 'drop-shadow(0 0 4px #c0c0c0)',
//         height: '85px',
//         left: 0,
//         padding: '8px 8px 8px 20%',
//         position: 'fixed',
//         right: 0,
//         top: 0,
//     },
// };
// const componentStyleByEnv = {
//     develop: {
//         ...componentStyle.control,
//     },
//     staging: {
//         ...componentStyle.control,
//     },
//     sandbox: {
//         ...componentStyle.control,
//     },
//     production: {
//         ...componentStyle.control,
//         backgroundColor: '#fff0f0',
//     },
// }

// export const TopMenu = withLinkedObserving<any, { env, style }>(({ children, env = null, style = null }) => {
//     return <div style={ style ?? (env ? componentStyleByEnv[env] ?? componentStyle.control : componentStyle.control) }>{ children }</div>;
// }, { env: true });
