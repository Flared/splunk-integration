import React, { FC, useState } from 'react';
import TooltipIcon from './icons/TooltipIcon';
import CloseIcon from './icons/CloseIcon';

import './Tooltip.css';

const TOOLTIP_WINDOW_ID = 'tooltip-window';

const Tooltip: FC<{}> = ({ children }) => {
    const [isOpened, setIsOpened] = useState(false);

    function globalClickListener(event: MouseEvent) {
        const tooltipWindow = document.getElementById(TOOLTIP_WINDOW_ID);

        if (
            tooltipWindow &&
            event.target instanceof HTMLElement &&
            !tooltipWindow.contains(event.target)
        ) {
            toggleOpened(false);
        }
    }

    function toggleOpened(open: boolean) {
        if (open) {
            document.addEventListener('click', globalClickListener);
        } else {
            document.removeEventListener('click', globalClickListener);
        }
        setIsOpened(open);
    }

    return (
        <div className="tooltip-container">
            <span className="tooltip-button" hidden={!isOpened} onClick={() => toggleOpened(false)}>
                <CloseIcon remSize={1} />
            </span>
            <span className="tooltip-button" hidden={isOpened} onClick={() => toggleOpened(true)}>
                <TooltipIcon remSize={1} />
            </span>
            <div hidden={!isOpened} id={TOOLTIP_WINDOW_ID} className="tooltip">
                {children}
            </div>
        </div>
    );
};

export default Tooltip;
