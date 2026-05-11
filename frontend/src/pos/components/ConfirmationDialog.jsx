import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Info, 
  CheckCircle, 
  XCircle,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from '@/pos/components/ui/button';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, danger, info, success
  isLoading = false,
  confirmButtonProps = {},
  cancelButtonProps = {},
  children
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      case 'success':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
      default:
        return 'bg-zinc-900 hover:bg-zinc-800 text-white focus:ring-zinc-500';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999] overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header/Content Area */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl ${getIconBgColor()} shadow-inner`}>
              {getIcon()}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight leading-tight mb-2">
                {title}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {message}
              </p>
              {children && (
                <div className="mt-4">
                  {children}
                </div>
              )}
            </div>

            {/* Close Button */}
            {!isLoading && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-zinc-50/80 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-zinc-100">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:flex-1 h-11 font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] ${getConfirmButtonStyles()}`}
            {...confirmButtonProps}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:flex-1 h-11 font-semibold rounded-xl border-zinc-200 text-zinc-600 hover:bg-white hover:border-zinc-300 transition-all active:scale-[0.98]"
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Specialized confirmation dialogs
export const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, itemName, itemType = "item", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Delete ${itemType}`}
    message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
    confirmText="Delete"
    type="danger"
    isLoading={isLoading}
  />
);

export const CancelConfirmationDialog = ({ isOpen, onClose, onConfirm, itemName, itemType = "order", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Cancel ${itemType}`}
    message={`Are you sure you want to cancel "${itemName}"? This action cannot be undone.`}
    confirmText="Cancel Order"
    type="warning"
    isLoading={isLoading}
  />
);

export const ClearConfirmationDialog = ({ isOpen, onClose, onConfirm, itemCount = 0, itemType = "items", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Clear All Items"
    message={`Are you sure you want to clear all ${itemCount} ${itemType}? This action cannot be undone.`}
    confirmText="Clear All"
    type="warning"
    isLoading={isLoading}
  >
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-2">
      <div className="flex gap-3">
        <Shield className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-amber-800 font-bold mb-1">Security Warning</p>
          <p className="text-amber-700/80 leading-relaxed">All items will be removed from the current session and cannot be recovered.</p>
        </div>
      </div>
    </div>
  </ConfirmationDialog>
);

export const BulkDeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, itemCount = 0, itemType = "items", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Bulk Delete"
    message={`Are you sure you want to delete ${itemCount} ${itemType}? This action cannot be undone.`}
    confirmText={`Delete ${itemCount} Items`}
    type="danger"
    isLoading={isLoading}
  >
    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-2">
      <div className="flex gap-3">
        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-red-800 font-bold mb-1">Permanent Deletion</p>
          <p className="text-red-700/80 leading-relaxed">All selected items will be permanently removed from the system. This action is irreversible.</p>
        </div>
      </div>
    </div>
  </ConfirmationDialog>
);

export default ConfirmationDialog;

