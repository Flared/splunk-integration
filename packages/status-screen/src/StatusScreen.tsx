import React, { useEffect, FC, useState } from 'react';
import './global.css';
import './StatusScreen.css';
import { findCollection, getVersionName, retrieveTenantId } from './utils/setupConfiguration';
import { SplunkCollectionItem } from './models/splunk';
import Button from './components/Button';

const COLLECTION_KEYS_NEXT_PREFIX = 'next_';

enum StatusItemKeys {
    START_DATE = 'start_date',
    LAST_FETCHED = 'timestamp_last_fetch',
    NEXT_TOKEN = 'next_token',
    CURRENT_TENANT_ID = 'current_tenant_id',
}

interface StatusItem {
    key: StatusItemKeys;
    name: string;
    value: string;
}

const StatusScreen: FC<{ theme: string }> = ({ theme }) => {
    const [versionName, setVersionName] = useState<string>('unknown');
    const [statusItems, setStatusItem] = useState<StatusItem[]>([]);
    const [isShowingAllItems, setShowingAllItems] = useState<boolean>(false);

    useEffect(() => {
        Promise.all([retrieveTenantId(), findCollection(), getVersionName()]).then(
            ([id, splunkCollectionItems, version]) => {
                const items: StatusItem[] = [];
                items.push({
                    key: StatusItemKeys.CURRENT_TENANT_ID,
                    name: getItemName(StatusItemKeys.CURRENT_TENANT_ID),
                    value: `${id}`,
                });
                splunkCollectionItems.forEach((item) => {
                    items.push({
                        key: item.key.startsWith(COLLECTION_KEYS_NEXT_PREFIX)
                            ? StatusItemKeys.NEXT_TOKEN
                            : (item.key as StatusItemKeys),
                        name: getItemName(item.key),
                        value: formatValue(item),
                    });
                });
                setStatusItem(items);
                setVersionName(version);
            }
        );
    }, []);

    useEffect(() => {
        const container = document.getElementById('container') as HTMLDivElement;
        const parentContainer = container.parentElement?.parentElement ?? undefined;
        if (parentContainer) {
            parentContainer.className = `parent-container ${theme === 'dark' ? 'dark' : ''}`;
        }
    }, [theme]);

    function getItems(): StatusItem[] {
        return statusItems
            .filter((item: StatusItem) => {
                if (!isShowingAllItems) {
                    return item.key === StatusItemKeys.LAST_FETCHED;
                }

                return true;
            })
            .reverse();
    }

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
            <div id="experimental">This is an experimental release</div>
            <div className="content">
                <div>
                    <h2>Status</h2>
                    <small>{`Version: ${versionName}`}</small>
                </div>
                <div id="status-list">
                    {getItems().map((item) => {
                        return (
                            <span className="status-item" key={item.key}>
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
