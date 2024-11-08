import React, { ChangeEvent, FC } from 'react';

import './Select.css';

const Select: FC<{ id?: string; value?: any; onChange: (e: ChangeEvent) => void }> = ({
    id,
    value,
    onChange,
    children,
}) => {
    return (
        <div className="select-container">
            <select id={id} onChange={onChange} value={value}>
                {children}
            </select>
        </div>
    );
};

export default Select;
