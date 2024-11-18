import React from 'react';

import layout from '@splunk/react-page';
import StatusScreen from '@flare/react-components/status-screen';
import { getUserTheme } from '@splunk/splunk-utils/themes';

getUserTheme()
    .then((theme) => {
        layout(<StatusScreen theme={theme} />, {
            theme,
        });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
