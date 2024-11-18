import React, { FC } from 'react';

import './Icon.css';

const ToolIcon: FC<{ remSize: number; hidden?: boolean }> = ({ remSize, hidden = false }) => {
    return (
        <div
            style={{
                width: `${remSize}rem`,
                height: `${remSize}rem`,
            }}
            className="icon"
            hidden={hidden}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={`${remSize * 0.6}rem`}
                height={`${remSize * 0.6}rem`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        </div>
    );
};

export default ToolIcon;
