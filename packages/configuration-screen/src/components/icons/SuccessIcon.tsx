import React, { FC } from 'react';

const SuccessIcon: FC<{ remSize: number; hidden?: boolean }> = ({ remSize, hidden }) => {
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
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12.8332 6.46334V7C12.8325 8.25792 12.4251 9.4819 11.6719 10.4894C10.9188 11.4969 9.86009 12.2339 8.6538 12.5906C7.44751 12.9473 6.15824 12.9044 4.97828 12.4685C3.79832 12.0326 2.79089 11.2269 2.10623 10.1716C1.42158 9.11636 1.09638 7.86804 1.17915 6.61285C1.26192 5.35767 1.74821 4.16286 2.5655 3.20663C3.38279 2.2504 4.4873 1.58398 5.71428 1.30675C6.94127 1.02953 8.22499 1.15637 9.37401 1.66834M12.8332 2.33334L6.99984 8.1725L5.24984 6.4225"
                    stroke="#21AB6B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default SuccessIcon;
