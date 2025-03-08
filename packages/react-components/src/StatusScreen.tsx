import React, { FC, useEffect, useState } from 'react';
import Button from './components/Button';
import './global.css';
import './StatusScreen.css';
import {
    fetchIngestionStatus,
    fetchCurrentIndexName,
    fetchVersionName,
} from './utils/setupConfiguration';

enum StatusItemKeys {
    START_DATE = 'start_date',
    LAST_FETCHED = 'timestamp_last_fetch',
    NEXT_TOKEN = 'next_token',
    INDEX = 'index',
    VERSION = 'version',
}

interface StatusItem {
    key: StatusItemKeys;
    name: string;
    value: string;
}

const StatusScreen: FC<{ theme: string }> = ({ theme }) => {
    const [statusItems, setStatusItem] = useState<StatusItem[]>([]);
    const [advancedStatusItems, setAdvancedStatusItem] = useState<StatusItem[]>([]);
    const [isShowingAllItems, setShowingAllItems] = useState<boolean>(false);

    useEffect(() => {
        Promise.all([
            fetchIngestionStatus(),
            fetchVersionName('unknown'),
            fetchCurrentIndexName(),
        ]).then(([ingestionStatus, version, indexName]) => {
            setStatusItem([
                {
                    key: StatusItemKeys.VERSION,
                    name: 'Version',
                    value: `${version}`,
                },
                {
                    key: StatusItemKeys.INDEX,
                    name: 'Splunk Index',
                    value: `${indexName}`,
                },
            ]);

            setAdvancedStatusItem([
                {
                    key: StatusItemKeys.LAST_FETCHED,
                    name: 'Last moment the events were ingested',
                    value: ingestionStatus.last_fetched_at
                        ? new Date(ingestionStatus.last_fetched_at).toLocaleString()
                        : 'N/A',
                },
            ]);
        });
    }, []);

    useEffect(() => {
        const container = document.getElementById('container') as HTMLDivElement;
        const parentContainer = container.parentElement?.parentElement ?? undefined;
        if (parentContainer) {
            parentContainer.className = `parent-container ${theme === 'dark' ? 'dark' : ''}`;
        }
    }, [theme]);

    const toggleShowingAllItems = (): void => setShowingAllItems(!isShowingAllItems);

    return (
        <div id="container" className={theme === 'dark' ? 'dark' : ''}>
            <div className="content">
                <div>
                    <h2>Status</h2>
                </div>
                <div id="status-list">
                    {statusItems.map((item) => {
                        return (
                            <span className="status-item" key={item.key}>
                                <span className="status-item-name">{item.name}</span>
                                <span className="status-item-value">{item.value}</span>
                            </span>
                        );
                    })}
                    {advancedStatusItems.map((item) => {
                        return (
                            <span
                                className="status-item"
                                key={item.key}
                                hidden={!isShowingAllItems}
                            >
                                <span className="status-item-name">{item.name}</span>
                                <span className="status-item-value">{item.value}</span>
                            </span>
                        );
                    })}
                </div>
                <Button onClick={toggleShowingAllItems} isSecondary>
                    {isShowingAllItems ? `Show Less` : `Show Advanced`}
                </Button>
            </div>
        </div>
    );
};

export default StatusScreen;
