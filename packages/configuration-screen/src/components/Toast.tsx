import React, { FC, useEffect, useState } from 'react';
import ErrorIcon from './icons/ErrorIcon';
import SuccessIcon from './icons/SuccessIcon';

import './Toast.css';

export interface ToastProps {
    id: string;
    isError?: boolean;
    content: string;
    duration?: number;
    onDestroy: () => void;
}

const Toast: FC<ToastProps> = (props) => {
    const { onDestroy, isError = false, content, duration = 5000, id } = props;
    const [hasTimeout, setHasTimeout] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasTimeout(true);
            setTimeout(() => {
                onDestroy();
            }, 175);
        }, duration);

        return () => clearTimeout(timer);
    }, [onDestroy, duration]);

    return (
        <div
            id={id}
            className={`toast-container ${isError ? 'toast-error' : 'toast-success'} ${
                hasTimeout ? 'toast-timed-out' : ''
            }`}
        >
            <ErrorIcon remSize={1} hidden={!isError} />
            <SuccessIcon remSize={1} hidden={isError} />
            <div className="toast-text">{content}</div>
        </div>
    );
};

export default Toast;
