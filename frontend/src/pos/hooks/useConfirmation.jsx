import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning',
    onConfirm: null,
    onCancel: null,
    isLoading: false
  });

  const showConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmation({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning',
        onConfirm: async () => {
          if (options.onConfirm) {
            await options.onConfirm();
          }
          resolve(true);
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel();
          }
          resolve(false);
        },
        isLoading: false
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false
    }));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setConfirmation(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      if (confirmation.onConfirm) {
        await confirmation.onConfirm();
      }
      hideConfirmation();
    } catch (error) {
      // Confirmation action failed - error handled by caller
      setLoading(false);
    }
  }, [confirmation.onConfirm, hideConfirmation, setLoading]);

  const handleCancel = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    hideConfirmation();
  }, [confirmation.onCancel, hideConfirmation]);

  return {
    ...confirmation,
    confirmation, // Included for backward compatibility in some components
    showConfirmation,
    hideConfirmation,
    setLoading,
    handleConfirm,
    handleCancel
  };
};

// Specialized hooks for common confirmation types
export const useDeleteConfirmation = () => {
  const { showConfirmation, ...rest } = useConfirmation();

  const confirmDelete = useCallback((itemName, itemType, onConfirm) => {
    // If onConfirm is passed as 3rd arg, it's the callback pattern (Employees.jsx)
    // If not, showConfirmation returns a promise (Warehouses.jsx)
    return showConfirmation({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : undefined
    });
  }, [showConfirmation]);

  return {
    ...rest,
    confirmDelete
  };
};

export const useCancelConfirmation = () => {
  const { showConfirmation, ...rest } = useConfirmation();

  const confirmCancel = useCallback((itemName, itemType, onConfirm) => {
    return showConfirmation({
      title: `Cancel ${itemType}`,
      message: `Are you sure you want to cancel "${itemName}"? This action cannot be undone.`,
      confirmText: 'Cancel Order',
      type: 'warning',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : undefined
    });
  }, [showConfirmation]);

  return {
    ...rest,
    confirmCancel
  };
};

export const useClearConfirmation = () => {
  const { showConfirmation, ...rest } = useConfirmation();

  const confirmClear = useCallback((itemCount, itemType, onConfirm) => {
    return showConfirmation({
      title: 'Clear All Items',
      message: `Are you sure you want to clear all ${itemCount} ${itemType}? This action cannot be undone.`,
      confirmText: 'Clear All',
      type: 'warning',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : undefined
    });
  }, [showConfirmation]);

  return {
    ...rest,
    confirmClear
  };
};

export const useBulkDeleteConfirmation = () => {
  const { showConfirmation, ...rest } = useConfirmation();

  const confirmBulkDelete = useCallback((itemCount, itemType, onConfirm) => {
    return showConfirmation({
      title: 'Bulk Delete',
      message: `Are you sure you want to delete ${itemCount} ${itemType}? This action cannot be undone.`,
      confirmText: `Delete ${itemCount} Items`,
      type: 'danger',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : undefined
    });
  }, [showConfirmation]);

  return {
    ...rest,
    confirmBulkDelete
  };
};

export default useConfirmation;

