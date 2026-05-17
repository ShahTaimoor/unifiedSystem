import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateRequired, validatePositiveNumber } from '../utils/validation';
import { LoadingButton } from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { useUpdateStockMutation } from '../store/services/inventoryApi';

const StockUpdateModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [updateType, setUpdateType] = useState('adjustment');
  const [updateStock, { isLoading: updating }] = useUpdateStockMutation();

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm
  } = useFormValidation(
    {
      quantity: '',
      reason: '',
      cost: '',
      notes: '',
    },
    {
      quantity: (value) => validateRequired(value, 'Quantity') || validatePositiveNumber(value, 'Quantity') || null,
      reason: (value) => validateRequired(value, 'Reason') || null,
    }
  );

  // Update stock mutation
  const resetModal = () => {
    resetForm();
    setUpdateType('adjustment');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.values(formErrors).some(e => e !== null)) {
      showErrorToast('Please correct the form errors');
      return;
    }
    
    let movementType = 'adjustment';
    let quantity = parseFloat(values.quantity);
    
    // Determine movement type based on update type
    switch (updateType) {
      case 'add':
        movementType = 'in';
        break;
      case 'remove':
        movementType = 'out';
        break;
      case 'adjustment':
        // For adjustment, quantity is the new total stock level
        quantity = parseFloat(values.quantity);
        break;
      default:
        break;
    }
    
    const stockData = {
      productId: product?.product?._id || product?._id,
      type: movementType,
      quantity: updateType === 'adjustment' ? quantity : Math.abs(quantity),
      reason: values.reason,
      cost: values.cost ? parseFloat(values.cost) : undefined,
      notes: values.notes,
    };
    
    updateStock(stockData)
      .unwrap()
      .then(() => {
        showSuccessToast('Stock updated successfully');
        onSuccess();
        resetModal();
      })
      .catch((error) => {
        handleApiError(error, 'Stock Update');
      });
  };

  const getMovementIcon = () => {
    switch (updateType) {
      case 'add':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'remove':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'adjustment':
        return <Package className="h-5 w-5 text-blue-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMovementLabel = () => {
    switch (updateType) {
      case 'add':
        return 'Add Stock';
      case 'remove':
        return 'Remove Stock';
      case 'adjustment':
        return 'Adjust Stock';
      default:
        return 'Update Stock';
    }
  };

  const getQuantityLabel = () => {
    switch (updateType) {
      case 'add':
        return 'Quantity to Add';
      case 'remove':
        return 'Quantity to Remove';
      case 'adjustment':
        return 'New Stock Level';
      default:
        return 'Quantity';
    }
  };

  const getQuantityPlaceholder = () => {
    switch (updateType) {
      case 'adjustment':
        return product?.currentStock?.toString() || '0';
      default:
        return '0';
    }
  };

  if (!product) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getMovementLabel()}
      maxWidth="md"
    >
      <div className="p-6">
        {/* Product Info */}
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg leading-tight">
                {product?.product?.name || product?.name || 'Unknown Product'}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Category: {typeof (product?.product?.category ?? product?.category) === 'object' ? ((product?.product?.category ?? product?.category)?.name ?? 'N/A') : (product?.product?.category || product?.category || 'N/A')}
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Stock</div>
              <div className="font-mono font-bold text-2xl text-gray-900">
                {product?.currentStock || product?.inventory?.currentStock || 0}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available</div>
              <div className="font-mono font-bold text-2xl text-primary-600">
                {product?.availableStock || (product?.currentStock || 0) - (product?.reservedStock || 0)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Update Type */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Movement Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setUpdateType('add')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  updateType === 'add'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-500/10'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <TrendingUp className="h-5 w-5 mb-2" />
                <span className="text-[10px] font-bold uppercase">Add</span>
              </button>
              <button
                type="button"
                onClick={() => setUpdateType('remove')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  updateType === 'remove'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-500/10'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <TrendingDown className="h-5 w-5 mb-2" />
                <span className="text-[10px] font-bold uppercase">Remove</span>
              </button>
              <button
                type="button"
                onClick={() => setUpdateType('adjustment')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  updateType === 'adjustment'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-500/10'
                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <Package className="h-5 w-5 mb-2" />
                <span className="text-[10px] font-bold uppercase">Adjust</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              {getQuantityLabel()} <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="quantity"
              value={values.quantity}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`rounded-xl py-8 text-xl font-mono font-bold ${errors.quantity ? 'border-red-500' : ''}`}
              placeholder={getQuantityPlaceholder()}
              min="0"
              step="0.01"
              autoFocus
            />
            {errors.quantity && <p className="text-red-600 text-[10px] font-bold uppercase mt-1.5 px-1">{errors.quantity}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Movement Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="reason"
              value={values.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-gray-700 ${errors.reason ? 'border-red-500' : ''}`}
            >
              <option value="">Select a reason</option>
              <option value="Physical count">Physical count</option>
              <option value="Damaged goods">Damaged goods</option>
              <option value="Theft/Loss">Theft/Loss</option>
              <option value="Transfer">Transfer</option>
              <option value="Return">Return</option>
              <option value="Purchase receipt">Purchase receipt</option>
              <option value="Sale">Sale</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Other">Other</option>
            </select>
            {errors.reason && <p className="text-red-600 text-[10px] font-bold uppercase mt-1.5 px-1">{errors.reason}</p>}
          </div>

          {/* Cost (optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Cost per Unit (Optional)
            </label>
            <Input
              type="number"
              name="cost"
              value={values.cost}
              onChange={handleChange}
              onBlur={handleBlur}
              className="rounded-xl py-6 font-mono font-bold"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Internal Notes
            </label>
            <Textarea
              name="notes"
              value={values.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              className="rounded-xl p-4 bg-gray-50/50"
              placeholder="Optional notes for record..."
            />
          </div>

          {/* Preview */}
          {values.quantity && (
            <div className="bg-primary-900 rounded-2xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${updateType === 'add' ? 'bg-green-500/20 text-green-400' : updateType === 'remove' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {getMovementIcon()}
                </div>
                <span className="font-bold text-sm uppercase tracking-widest">Movement Preview</span>
              </div>
              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span>Current Stock</span>
                  <span>{product?.currentStock || product?.inventory?.currentStock || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>{updateType === 'add' ? 'Adding' : updateType === 'remove' ? 'Removing' : 'New Level'}</span>
                  <span className={updateType === 'add' ? 'text-green-400' : updateType === 'remove' ? 'text-red-400' : 'text-blue-400'}>
                    {updateType === 'adjustment' ? values.quantity : `${updateType === 'add' ? '+' : '-'}${values.quantity}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold">Estimated Final Stock</span>
                  <span className="text-xl font-bold text-primary-400">
                    {updateType === 'adjustment' 
                      ? values.quantity 
                      : updateType === 'add' 
                        ? (product?.currentStock || 0) + parseFloat(values.quantity || 0)
                        : Math.max(0, (product?.currentStock || 0) - parseFloat(values.quantity || 0))
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="px-8 rounded-xl border-gray-200"
            >
              Discard
            </Button>
            <LoadingButton
              type="submit"
              isLoading={updating}
              className="px-10 rounded-xl shadow-lg shadow-primary-500/20"
            >
              Confirm Update
            </LoadingButton>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default StockUpdateModal;
