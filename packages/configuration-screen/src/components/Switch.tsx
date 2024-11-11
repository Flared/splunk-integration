import React, { ChangeEvent, FC } from 'react';

import './Switch.css';

const Switch: FC<{ value?: boolean; onChange: (e: ChangeEvent) => void }> = ({
    value = false,
    onChange,
}) => {
    return (
        <label className="switch">
            <input type="checkbox" checked={value} onChange={onChange} />
            <span className="slider" />
        </label>
    );
};

export default Switch;
