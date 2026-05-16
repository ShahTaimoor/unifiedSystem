/**
 * Bulk Update Modal Component
 * Modal for bulk updating products/customers/orders
 */

import React, { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { LoadingButton } from './LoadingSpinner';
import BaseModal from './BaseModal';

export const BulkUpdateModal = ({
  isOpen,
  onClose,
  selectedCount,
  updateType, // 'price', 'category', 'status', 'stock', 'tier', 'tags'
  onConfirm,
  categories = [],
  statusOptions = [],
  tierOptions = [],
  isLoading = false
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (updateType === 'price' && !formData.priceType) {
      newErrors.priceType = 'Please select a price type';
    }
    if (updateType === 'price' && formData.priceValue === undefined) {
      newErrors.priceValue = 'Please enter a price value';
    }
    if (updateType === 'category' && !formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (updateType === 'status' && !formData.status) {
      newErrors.status = 'Please select a status';
    }
    if (updateType === 'stock' && formData.stockAdjustment === undefined) {
      newErrors.stockAdjustment = 'Please enter a stock adjustment';
    }
    if (updateType === 'tier' && !formData.tier) {
      newErrors.tier = 'Please select a tier';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(formData);
  };

  const renderForm = () => {
    switch (updateType) {
      case 'price':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Type
              </label>
              <select
                value={formData.priceType || ''}
                onChange={(e) => handleChange('priceType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.priceType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select price type</option>
                <option value="retail">Retail Price</option>
                <option value="wholesale">Wholesale Price</option>
                <option value="cost">Cost Price</option>
              </select>
              {errors.priceType && (
                <p className="mt-1 text-sm text-red-600">{errors.priceType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Method
              </label>
              <select
                value={formData.updateMethod || 'set'}
                onChange={(e) => handleChange('updateMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="set">Set to value</option>
                <option value="increase">Increase by amount</option>
                <option value="decrease">Decrease by amount</option>
                <option value="percentage">Change by percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.priceValue || ''}
                onChange={(e) => handleChange('priceValue', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.priceValue ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter value"
              />
              {errors.priceValue && (
                <p className="mt-1 text-sm text-red-600">{errors.priceValue}</p>
              )}
            </div>
          </div>
        );

      case 'category':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        );

      case 'status':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select status</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>
        );

      case 'stock':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Method
              </label>
              <select
                value={formData.stockMethod || 'set'}
                onChange={(e) => handleChange('stockMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="set">Set to value</option>
                <option value="increase">Increase by amount</option>
                <option value="decrease">Decrease by amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Adjustment
              </label>
              <input
                type="number"
                value={formData.stockAdjustment || ''}
                onChange={(e) => handleChange('stockAdjustment', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.stockAdjustment ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
              />
              {errors.stockAdjustment && (
                <p className="mt-1 text-sm text-red-600">{errors.stockAdjustment}</p>
              )}
            </div>
          </div>
        );

      case 'tier':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Tier
            </label>
            <select
              value={formData.tier || ''}
              onChange={(e) => handleChange('tier', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.tier ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select tier</option>
              {tierOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.tier && (
              <p className="mt-1 text-sm text-red-600">{errors.tier}</p>
            )}
          </div>
        );

      case 'tags':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags || ''}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="tag1, tag2, tag3"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter tags separated by commas. Existing tags will be replaced.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    const titles = {
      price: 'Bulk Update Prices',
      category: 'Bulk Change Category',
      status: 'Bulk Change Status',
      stock: 'Bulk Adjust Stock',
      tier: 'Bulk Change Customer Tier',
      tags: 'Bulk Update Tags'
    };
    return titles[updateType] || 'Bulk Update';
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      maxWidth="md"
      variant="centered"
    >
      <div className="p-6">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              This action will update <strong className="font-bold text-blue-900">{selectedCount}</strong> {selectedCount === 1 ? 'item' : 'items'}. Please review your changes carefully.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderForm()}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4 mr-2" />
              Update {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default BulkUpdateModal;

