import React from 'react';
import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Modal from '@splunk/react-ui/Modal';

interface SaveConfirmModalProps {
    open: boolean;
    indexName: string;
    showMacroWarning: boolean;
    saveBtnRef: React.RefObject<any>;
    onClose: () => void;
}

/**
 * "Configuration Saved" success modal. Shows an extra warning when the
 * user has changed the target index (requiring a manual macro update).
 */
export function SaveConfirmModal({
    open,
    indexName,
    showMacroWarning,
    saveBtnRef,
    onClose,
}: SaveConfirmModalProps) {
    return (
        <Modal onRequestClose={onClose} open={open} returnFocus={saveBtnRef}>
            <Modal.Header title="Configuration Saved" />
            <Modal.Body>
                Your Flare configuration has been successfully saved.
                {showMacroWarning && (
                    <div style={{ marginTop: 16 }}>
                        <Message appearance="fill" type="warning">
                            <strong>Action Required:</strong> Since you changed the destination index, you must
                            manually update the <code>flare_index</code> search macro to point to{' '}
                            <code>index="{indexName}"</code> under{' '}
                            <strong>Settings &gt; Advanced Search &gt; Search Macros</strong>. Your dashboards
                            will show blank data until you update it!
                        </Message>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button appearance="primary" onClick={onClose} label="OK" autoFocus />
            </Modal.Footer>
        </Modal>
    );
}
