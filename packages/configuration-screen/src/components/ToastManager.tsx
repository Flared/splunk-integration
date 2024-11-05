import React from 'react';
import ReactDOM from 'react-dom';
import Toast, { ToastProps } from './Toast';
import './ToastManager.css';

interface ToastOptions {
    id: string;
    isError?: boolean;
    content: string;
    duration?: number;
}

const TOAST_CONTAINER_ID = 'toast-container-main';

export class ToastManager {
    private containerRef: HTMLDivElement;

    private toasts: ToastProps[] = [];

    constructor() {
        const body = document.getElementsByTagName('body')[0] as HTMLBodyElement;
        const toastContainer = document.createElement('div') as HTMLDivElement;
        toastContainer.id = TOAST_CONTAINER_ID;
        body.insertAdjacentElement('beforeend', toastContainer);
        this.containerRef = toastContainer;
    }

    public setTheme(theme: string) {
        if (theme === 'dark') {
            this.containerRef.className = theme;
        } else {
            this.containerRef.className = '';
        }
    }

    public show(options: ToastOptions): void {
        const toast: ToastProps = {
            ...options,
            onDestroy: () => this.destroy(options.id),
        };

        if (this.toasts.filter((p) => p.id === options.id).length === 0) {
            this.toasts = [toast, ...this.toasts];
            this.render();
        }
    }

    public destroy(id: string): void {
        this.toasts = this.toasts.filter((toast: ToastProps) => toast.id !== id);
        this.render();
    }

    private render(): void {
        const toastsList = this.toasts.map((toastProps: ToastProps) => (
            <Toast key={toastProps.id} {...toastProps} />
        ));
        ReactDOM.render(toastsList, this.containerRef);
    }
}

export const toastManager = new ToastManager();
