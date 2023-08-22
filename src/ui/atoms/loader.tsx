import React from 'react';
import './loader.css';

export const Loader = ({ isShown }) => {
    if (isShown) {
        return  <div className='loader'><div className='loader ring'><div></div></div></div>;
    }

    return null;
}
