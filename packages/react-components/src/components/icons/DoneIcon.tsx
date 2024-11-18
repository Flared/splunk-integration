import React, { FC } from 'react';

import './Icon.css';

const DoneIcon: FC<{ remSize: number; hidden?: boolean }> = ({ remSize, hidden }) => {
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
                width={`${remSize * 0.6}rem`}
                height={`${remSize * 0.6}rem`}
                viewBox="0 0 46 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M23 43C34.0457 43 43 34.0457 43 23C43 11.9543 34.0457 3 23 3C11.9543 3 3 11.9543 3 23C3 34.0457 11.9543 43 23 43Z"
                    stroke="#9BA8EE"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M 33 16 L 21 30.0201 L 15 24.0201"
                    stroke="#9BA8EE"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default DoneIcon;
