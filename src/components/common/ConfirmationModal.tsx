'use client';

import React from 'react';
import { AlertTriangle, Info, LogOut, Trash2, X } from 'lucide-react';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: 'logout' | 'delete' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  if (!isOpen || !options) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    icon = 'warning',
    onConfirm,
    onCancel,
  } = options;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (icon) {
      case 'logout':
        return <LogOut className="w-6 h-6 text-amber-400" />;
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-400" />;
      case 'info':
        return <Info className="w-6 h-6 text-sky-400" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500/15 border-red-500/30';
      case 'info':
        return 'bg-sky-500/15 border-sky-500/30';
      case 'warning':
      default:
        return 'bg-amber-500/15 border-amber-500/30';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'info':
        return 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.4)]';
      case 'warning':
      default:
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
        {/* Close Top-Right */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getHeaderBg()}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Content Message */}
        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words bg-black/30 p-3.5 rounded-2xl border border-white/5">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black tracking-wide transition-all active:scale-95 cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
