import React from 'react';

import layout from '@splunk/react-page';
import ConfigurationScreen from '@flare/react-components/configuration-screen';
import { getUserTheme } from '@splunk/splunk-utils/themes';

getUserTheme()
    .then((theme) => {
        layout(<ConfigurationScreen theme={theme} />, {
            theme,
        });
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
