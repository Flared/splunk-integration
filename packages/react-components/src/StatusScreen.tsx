import React, { useEffect, FC, useState } from 'react';
import './global.css';
import './StatusScreen.css';
import {
    fetchTenantId,
    fetchVersionName,
    fetchCollectionItems,
    fetchCurrentIndexName,
} from './utils/setupConfiguration';
import { SplunkCollectionItem } from './models/splunk';
import Button from './components/Button';

const COLLECTION_KEYS_NEXT_PREFIX = 'next_';

enum StatusItemKeys {
    START_DATE = 'start_date',
    LAST_FETCHED = 'timestamp_last_fetch',
    NEXT_TOKEN = 'next_token',
    CURRENT_TENANT_ID = 'current_tenant_id',
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
            fetchTenantId(),
            fetchCollectionItems(),
            fetchVersionName('unknown'),
            fetchCurrentIndexName(),
        ]).then(([id, splunkCollectionItems, version, indexName]) => {
            const items: StatusItem[] = [
                {
                    key: StatusItemKeys.VERSION,
                    name: getItemName(StatusItemKeys.VERSION),
                    value: `${version}`,
                },
                {
                    key: StatusItemKeys.INDEX,
                    name: getItemName(StatusItemKeys.INDEX),
                    value: `${indexName}`,
                },
            ];
            const advancedItems: StatusItem[] = [
                {
                    key: StatusItemKeys.CURRENT_TENANT_ID,
                    name: getItemName(StatusItemKeys.CURRENT_TENANT_ID),
                    value: `${id}`,
                },
            ];
            splunkCollectionItems.forEach((item) => {
                if (item.key === StatusItemKeys.LAST_FETCHED) {
                    items.push({
                        key: item.key.startsWith(COLLECTION_KEYS_NEXT_PREFIX)
                            ? StatusItemKeys.NEXT_TOKEN
                            : (item.key as StatusItemKeys),
                        name: getItemName(item.key),
                        value: formatValue(item),
                    });
                } else {
                    advancedItems.push({
                        key: item.key.startsWith(COLLECTION_KEYS_NEXT_PREFIX)
                            ? StatusItemKeys.NEXT_TOKEN
                            : (item.key as StatusItemKeys),
                        name: getItemName(item.key),
                        value: formatValue(item),
                    });
                }
            });
            setStatusItem(items);
            setAdvancedStatusItem(advancedItems);
        });
    }, []);

    useEffect(() => {
        const container = document.getElementById('container') as HTMLDivElement;
        const parentContainer = container.parentElement?.parentElement ?? undefined;
        if (parentContainer) {
            parentContainer.className = `parent-container ${theme === 'dark' ? 'dark' : ''}`;
        }
    }, [theme]);

    function getItemName(key: string): string {
        if (key.startsWith(COLLECTION_KEYS_NEXT_PREFIX)) {
            const parsedTenantId = parseInt(key.substring(COLLECTION_KEYS_NEXT_PREFIX.length), 10);
            return `Next token for Tenant ID ${parsedTenantId}`;
        }

        if (key === StatusItemKeys.START_DATE) {
            return 'Date of the first time events were ingested';
        }

        if (key === StatusItemKeys.LAST_FETCHED) {
            return 'Last moment the events were ingested';
        }

        if (key === StatusItemKeys.CURRENT_TENANT_ID) {
            return 'Current Tenant ID';
        }

        if (key === StatusItemKeys.INDEX) {
            return 'Splunk Index';
        }

        if (key === StatusItemKeys.VERSION) {
            return 'Version';
        }

        return 'Unknown Status Item';
    }

    function formatValue(item: SplunkCollectionItem): string {
        if (item.key === StatusItemKeys.START_DATE || item.key === StatusItemKeys.LAST_FETCHED) {
            const date = new Date(item.value);
            return date.toLocaleString();
        }

        return item.value;
    }

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
