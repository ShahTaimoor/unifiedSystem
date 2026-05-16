import React from 'react';
import {
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BaseModal from './BaseModal';

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
  children,
  maxWidth = 'md',
  zIndex = 1200 // Higher than standard modals (1100)
}) => {
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
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-100';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-100';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white shadow-green-100';
      default:
        return 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-100';
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row-reverse gap-3 w-full">
      <Button
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className={`flex-1 sm:flex-none sm:min-w-[120px] h-12 rounded-xl font-bold transition-all ${getConfirmButtonStyles()}`}
        {...confirmButtonProps}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            Processing
          </>
        ) : (
          confirmText
        )}
      </Button>
      <Button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        variant="outline"
        className="flex-1 sm:flex-none sm:min-w-[100px] h-12 rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-50"
        {...cancelButtonProps}
      >
        {cancelText}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      zIndex={zIndex}
      variant="centered"
      showCloseButton={!isLoading}
      footer={footer}
      className="overflow-hidden"
    >
      <div className="p-6">
        <div className="sm:flex sm:items-start">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl ${getIconBgColor()} sm:mx-0 sm:h-12 sm:w-12 transition-transform duration-500 hover:scale-110`}>
            {getIcon()}
          </div>
          
          <div className="mt-4 text-center sm:mt-0 sm:ml-5 sm:text-left flex-1">
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            <div className="mt-3">
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                {message}
              </p>
              {children && (
                <div className="mt-5">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// Specialized confirmation dialogs
export const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, itemName, itemType = "item", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Terminate ${itemType}`}
    message={`Are you sure you want to permanently delete "${itemName}"? This action is irreversible and will be logged in the audit trail.`}
    confirmText="Confirm Delete"
    type="danger"
    isLoading={isLoading}
  />
);

export const CancelConfirmationDialog = ({ isOpen, onClose, onConfirm, itemName, itemType = "order", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Abort ${itemType}`}
    message={`Are you sure you want to cancel "${itemName}"? All unsaved progress for this transaction will be lost.`}
    confirmText="Abort Action"
    type="warning"
    isLoading={isLoading}
  />
);

export const ClearConfirmationDialog = ({ isOpen, onClose, onConfirm, itemCount = 0, itemType = "items", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Wipe Session Data"
    message={`Are you sure you want to clear all ${itemCount} ${itemType}? This will reset the current workspace state.`}
    confirmText="Wipe All"
    type="warning"
    isLoading={isLoading}
  >
    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-4 flex items-start space-x-3">
      <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="text-xs">
        <p className="text-amber-900 font-bold uppercase tracking-widest mb-1">Session Protocol</p>
        <p className="text-amber-700 leading-relaxed font-medium">All items will be purged from the active buffer. This cannot be undone.</p>
      </div>
    </div>
  </ConfirmationDialog>
);

export const BulkDeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, itemCount = 0, itemType = "items", isLoading = false }) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Mass Termination"
    message={`You are about to delete ${itemCount} ${itemType}. This is a bulk operation that affects multiple records.`}
    confirmText={`Delete ${itemCount} Assets`}
    type="danger"
    isLoading={isLoading}
  >
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-4 flex items-start space-x-3">
      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div className="text-xs">
        <p className="text-red-900 font-bold uppercase tracking-widest mb-1">Critical Warning</p>
        <p className="text-red-700 leading-relaxed font-medium">Bulk deletion is permanent. Ensure you have verified the selection set before proceeding.</p>
      </div>
    </div>
  </ConfirmationDialog>
);

export default ConfirmationDialog;

