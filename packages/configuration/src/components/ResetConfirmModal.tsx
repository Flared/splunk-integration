import React from 'react';
import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Modal from '@splunk/react-ui/Modal';

interface ResetConfirmModalProps {
    open: boolean;
    isRemoving: boolean;
    resetBtnRef: React.RefObject<any>;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * "Confirm Removal" modal — warns the user before wiping all configuration
 * and stopping data ingestion.
 */
export function ResetConfirmModal({
    open,
    isRemoving,
    resetBtnRef,
    onCancel,
    onConfirm,
}: ResetConfirmModalProps) {
    return (
        <Modal onRequestClose={onCancel} open={open} returnFocus={resetBtnRef}>
            <Modal.Header title="Confirm Removal" />
            <Modal.Body>
                <Message appearance="fill" type="warning">
                    Are you sure you want to remove all configuration values? This will clear your API key,
                    disable the integration, and immediately stop all Flare data ingestion into Splunk.
                </Message>
            </Modal.Body>
            <Modal.Footer>
                <Button appearance="secondary" onClick={onCancel} label="Cancel" disabled={isRemoving} />
                <Button
                    appearance="primary"
                    onClick={onConfirm}
                    label={isRemoving ? 'Removing...' : 'Yes, Remove & Stop Ingestion'}
                    disabled={isRemoving}
                />
            </Modal.Footer>
        </Modal>
    );
}
