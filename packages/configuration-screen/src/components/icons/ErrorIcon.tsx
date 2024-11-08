import React, { FC } from 'react';

const ErrorIcon: FC<{ remSize: number; hidden?: boolean }> = ({ remSize, hidden }) => {
    return (
        <div
            style={{
                width: `${remSize}rem`,
                height: `${remSize}rem`,
            }}
            hidden={hidden}
        >
            <svg
                width={`${remSize}rem`}
                height={`${remSize}rem`}
                viewBox="0 0 14 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M7.00001 5.25012V7.58345M7.00001 9.91679H7.00585M6.00251 2.25179L1.06168 10.5001C0.95981 10.6765 0.905909 10.8765 0.905339 11.0803C0.904769 11.284 0.957548 11.4843 1.05843 11.6613C1.15931 11.8382 1.30477 11.9857 1.48034 12.089C1.65591 12.1923 1.85548 12.2479 2.05918 12.2501H11.9408C12.1445 12.2479 12.3441 12.1923 12.5197 12.089C12.6953 11.9857 12.8407 11.8382 12.9416 11.6613C13.0425 11.4843 13.0953 11.284 13.0947 11.0803C13.0941 10.8765 13.0402 10.6765 12.9383 10.5001L7.99751 2.25179C7.89352 2.08035 7.7471 1.93861 7.57238 1.84024C7.39765 1.74186 7.20052 1.69019 7.00001 1.69019C6.7995 1.69019 6.60237 1.74186 6.42765 1.84024C6.25292 1.93861 6.1065 2.08035 6.00251 2.25179Z"
                    stroke="#E60038"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default ErrorIcon;
