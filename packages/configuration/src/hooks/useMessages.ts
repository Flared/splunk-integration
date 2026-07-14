import { useCallback, useState } from 'react';

/**
 * Manages global success/error banner messages displayed to the user.
 * Success messages auto-dismiss after 5 seconds.
 */
export function useMessages() {
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const showSuccess = useCallback((msg: string) => {
        setSuccessMessage(msg);
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 5000);
    }, []);

    const showError = useCallback((msg: string) => {
        setErrorMessage(msg);
        setSuccessMessage('');
    }, []);

    const clearMessages = useCallback(() => {
        setSuccessMessage('');
        setErrorMessage('');
    }, []);

    return {
        successMessage,
        setSuccessMessage,
        errorMessage,
        setErrorMessage,
        showSuccess,
        showError,
        clearMessages,
    };
}
