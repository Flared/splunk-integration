import React, { FC, useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import TooltipIcon from './icons/TooltipIcon';

import './Tooltip.css';

const TOOLTIP_WINDOW_ID = 'tooltip-window';

const Tooltip: FC<{
    openedByDefault?: boolean;
}> = ({ openedByDefault = false, children }) => {
    const [isOpened, setIsOpened] = useState(openedByDefault);

    function globalClickListener(event: MouseEvent): void {
        const tooltipWindow = document.getElementById(TOOLTIP_WINDOW_ID);

        if (
            tooltipWindow &&
            event.target instanceof HTMLElement &&
            !tooltipWindow.contains(event.target)
        ) {
            toggleOpen(false);
        }
    }

    function toggleOpen(open: boolean): void {
        if (open) {
            document.addEventListener('click', globalClickListener);
        } else {
            document.removeEventListener('click', globalClickListener);
        }
        setIsOpened(open);
    }

    return (
        <div className="tooltip-container">
            <span
                className="tooltip-button"
                hidden={!isOpened}
                onClick={(): void => toggleOpen(false)}
            >
                <CloseIcon remSize={1} />
            </span>
            <span
                className="tooltip-button"
                hidden={isOpened}
                onClick={(): void => toggleOpen(true)}
            >
                <TooltipIcon remSize={1} />
            </span>
            <div hidden={!isOpened} id={TOOLTIP_WINDOW_ID} className="tooltip">
                {children}
            </div>
        </div>
    );
};

export default Tooltip;
