import React, { FC } from 'react';

const ArrowRightIcon: FC<{ remSize: number; hidden?: boolean }> = ({ remSize, hidden }) => {
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
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M3.3335 7.99998H12.6668M12.6668 7.99998L8.00016 3.33331M12.6668 7.99998L8.00016 12.6666"
                    stroke="var(--text-color-link)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default ArrowRightIcon;
