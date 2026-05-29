import React from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Heading from '@splunk/react-ui/Heading';
import Select from '@splunk/react-ui/Select';
import Switch from '@splunk/react-ui/Switch';
import Text from '@splunk/react-ui/Text';
import { isProxyHostMissing, isProxyPortInvalid } from '../validation/formValidation';

interface ProxySettingsProps {
    proxyEnabled: boolean;
    proxyType: string;
    proxyHost: string;
    proxyPort: string;
    proxyUsername: string;
    proxyPassword: string;
    sslVerify: boolean;
    onProxyEnabledChange: (_e: unknown, { selected }: { selected: boolean }) => void;
    onProxyTypeChange: (_e: unknown, { value }: { value: string | number | boolean }) => void;
    onProxyHostChange: (_e: unknown, { value }: { value: string }) => void;
    onProxyPortChange: (_e: unknown, { value }: { value: string }) => void;
    onProxyUsernameChange: (_e: unknown, { value }: { value: string }) => void;
    onProxyPasswordChange: (_e: unknown, { value }: { value: string }) => void;
    onSslVerifyChange: (_e: unknown, { selected }: { selected: boolean }) => void;
}

/**
 * Full Proxy Settings section — enable toggle, SSL switch, and all proxy sub-fields.
 */
export function ProxySettings({
    proxyEnabled,
    proxyType,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
    sslVerify,
    onProxyEnabledChange,
    onProxyTypeChange,
    onProxyHostChange,
    onProxyPortChange,
    onProxyUsernameChange,
    onProxyPasswordChange,
    onSslVerifyChange,
}: ProxySettingsProps) {
    const hostMissing = isProxyHostMissing(proxyEnabled, proxyHost);
    const portInvalid = isProxyPortInvalid(proxyEnabled, proxyPort);

    return (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #ccc' }}>
            <Heading level={3}>Proxy Settings</Heading>

            <ControlGroup label="Enable Proxy" labelPosition="left">
                <Switch
                    selected={proxyEnabled}
                    onClick={onProxyEnabledChange}
                    appearance="toggle"
                />
            </ControlGroup>

            <ControlGroup
                label="Enable SSL Verification"
                labelPosition="left"
                help="Validates HTTPS certificates. Default is ON."
            >
                <Switch
                    selected={sslVerify}
                    onClick={onSslVerifyChange}
                    appearance="toggle"
                />
            </ControlGroup>

            {proxyEnabled && (
                <div style={{ marginTop: 16 }}>
                    <ControlGroup label="Proxy Type" labelPosition="top">
                        <Select value={proxyType} onChange={onProxyTypeChange}>
                            <Select.Option label="HTTP" value="http" />
                            <Select.Option label="HTTPS" value="https" />
                            <Select.Option label="SOCKS5" value="socks5" />
                            <Select.Option label="SOCKS4" value="socks4" />
                        </Select>
                    </ControlGroup>

                    <ControlGroup
                        label="Host or IP"
                        required
                        labelPosition="top"
                        help="e.g. proxy.company.local or 192.168.1.5"
                        error={hostMissing}
                    >
                        <div>
                            <Text
                                value={proxyHost}
                                onChange={onProxyHostChange}
                                placeholder="proxy.company.local"
                                error={hostMissing}
                            />
                            {hostMissing && (
                                <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                                    Proxy host is required when proxy is enabled.
                                </div>
                            )}
                        </div>
                    </ControlGroup>

                    <ControlGroup
                        label="Port"
                        required
                        labelPosition="top"
                        help="e.g. 8080"
                        error={portInvalid}
                    >
                        <div>
                            <Text
                                value={proxyPort}
                                onChange={onProxyPortChange}
                                placeholder="8080"
                                error={portInvalid}
                            />
                            {portInvalid && (
                                <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                                    Invalid proxy port. Must be a number between 1 and 65535.
                                </div>
                            )}
                        </div>
                    </ControlGroup>

                    <ControlGroup
                        label="Username (Optional)"
                        labelPosition="top"
                        help="Leave blank if no authentication is required."
                    >
                        <Text value={proxyUsername} onChange={onProxyUsernameChange} placeholder="proxy_user" />
                    </ControlGroup>

                    <ControlGroup
                        label="Password (Optional)"
                        labelPosition="top"
                        help="Encrypted via Splunk storage/passwords."
                    >
                        <Text
                            type="password"
                            value={proxyPassword}
                            onChange={onProxyPasswordChange}
                            placeholder="********"
                        />
                    </ControlGroup>
                </div>
            )}
        </div>
    );
}
