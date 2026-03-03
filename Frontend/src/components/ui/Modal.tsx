import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#05091a]/70 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-[520px] bg-surface-dark border border-surface-border rounded-2xl shadow-modal flex flex-col relative overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-surface-border bg-background-dark/50">
                    <h2
                        id="modal-title"
                        className="text-2xl font-bold text-white tracking-tight font-display"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                            close
                        </span>
                    </button>
                </div>
                {/* Body */}
                <div className="p-8 flex flex-col gap-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
