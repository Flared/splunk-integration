import React, { FC } from 'react';

import './Input.css';

const Input: FC<React.ComponentProps<'input'>> = ({ ...props }) => {
    return <input {...props} />;
};

export default Input;
