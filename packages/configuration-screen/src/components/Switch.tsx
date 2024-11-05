import React, { ChangeEvent, FC } from 'react';

import './Switch.css';

const Switch: FC<{ scale?: number; value?: boolean; onChange: (e: ChangeEvent) => void }> = ({
    scale = 1,
    value = false,
    onChange,
}) => {
    return (
        <label
            className="switch"
            style={{
                transform: `scale(${scale})`,
            }}
        >
            <input type="checkbox" checked={value} onChange={onChange} />
            <span className="slider" />
        </label>
    );
};

export default Switch;
