import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Plus, Minus, Package, AlertTriangle } from 'lucide-react';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateRequired, validatePositiveNumber } from '../utils/validation';
import { LoadingButton } from './LoadingSpinner';
import { handleApiError, showSuccessToast, showErrorToast } from '../utils/errorHandler';
import { useGetProductsQuery } from '../store/services/productsApi';
import { useCreateStockAdjustmentMutation } from '../store/services/inventoryApi';
import { SearchableDropdown } from './SearchableDropdown';
import { formatCurrency } from '../utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const StockAdjustmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('physical_count');
  const [adjustments, setAdjustments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setError,
    clearError
  } = useFormValidation(
    {
      reason: '',
      warehouse: 'Main Warehouse',
      notes: '',
    },
    {
      reason: (value) => validateRequired(value, 'Reason') || null,
    }
  );

  // Fetch products for search
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery(
    { search: productSearchTerm, limit: 20 },
    {
      skip: productSearchTerm.length === 0,
    }
  );

  const products = productsResponse?.data?.products || productsResponse?.products || [];

  // Create stock adjustment mutation
  const [createStockAdjustment, { isLoading: creating }] = useCreateStockAdjustmentMutation();

  const resetModal = () => {
    resetForm();
    setAdjustmentType('physical_count');
    setAdjustments([]);
    setSelectedProduct(null);
    setProductSearchTerm('');
    setIsAddingProduct(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setIsAddingProduct(true);
    
    // Check if product already exists in adjustments
    const existingAdjustment = adjustments.find(adj => adj.product._id === product._id);
    if (existingAdjustment) {
      showErrorToast('Product is already in the adjustment list');
      setIsAddingProduct(false);
      return;
    }
  };

  const addProductToAdjustment = (currentStock, adjustedStock) => {
    if (!selectedProduct) return;
    
    const variance = adjustedStock - currentStock;
    
    const newAdjustment = {
      product: selectedProduct,
      currentStock,
      adjustedStock,
      variance,
      cost: selectedProduct.pricing?.cost || 0,
      notes: '',
    };
    
    setAdjustments(prev => [...prev, newAdjustment]);
    setSelectedProduct(null);
    setIsAddingProduct(false);
    setProductSearchTerm('');
  };

  const removeAdjustment = (productId) => {
    setAdjustments(prev => prev.filter(adj => adj.product._id !== productId));
  };

  const updateAdjustment = (productId, field, value) => {
    setAdjustments(prev => prev.map(adj => {
      if (adj.product._id === productId) {
        const updated = { ...adj, [field]: value };
        if (field === 'adjustedStock') {
          updated.variance = value - adj.currentStock;
        }
        return updated;
      }
      return adj;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (adjustments.length === 0) {
      showErrorToast('Please add at least one product to adjust');
      return;
    }
    
    const formErrors = validateForm();
    if (Object.values(formErrors).some(e => e !== null)) {
      showErrorToast('Please correct the form errors');
      return;
    }
    
    const adjustmentData = {
      type: adjustmentType,
      reason: values.reason,
      warehouse: values.warehouse,
      notes: values.notes,
      adjustments: adjustments.map(adj => ({
        product: adj.product._id,
        currentStock: adj.currentStock,
        adjustedStock: adj.adjustedStock,
        cost: adj.cost,
        notes: adj.notes,
      })),
    };
    
    createStockAdjustment(adjustmentData)
      .unwrap()
      .then(() => {
        showSuccessToast('Stock adjustment request created successfully');
        onSuccess();
        resetModal();
      })
      .catch((error) => {
        handleApiError(error, 'Stock Adjustment Creation');
      });
  };

  const normalizeCategoryLabel = (category) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      if (React.isValidElement(category)) {
        return 'N/A';
      }

      const candidateFields = [
        'label',
        'name',
        'displayName',
        'title',
        'fullName',
        'code',
        'id',
        '_id'
      ];

      for (const field of candidateFields) {
        if (category[field]) {
          const value = category[field];
          if (typeof value === 'string') {
            return value;
          }
        }
      }
    }

    return 'N/A';
  };

  const getProductPrice = (product) => {
    if (!product) return null;

    const candidates = [
      product.price,
      product.defaultPrice,
      product.sellingPrice,
      product.cost,
      product.pricing?.retail,
      product.pricing?.sellingPrice,
      product.pricing?.wholesale,
      product.pricing?.price,
      product.pricing?.cost
    ];

    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined) continue;
      if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const parsed = parseFloat(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  };

  const formatProductPrice = (product) => {
    const price = getProductPrice(product);
    if (price === null) return 'Price: —';
    const formatted = formatCurrency(price) || '';
    return `Price: ${formatted || '—'}`;
  };

  const productDisplayKey = (product) => (
    <div className="flex items-center gap-3 text-sm text-gray-700 w-full">
      <span className="font-semibold text-gray-900 truncate">{product.name}</span>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500 text-right">
        <span>Category: {normalizeCategoryLabel(product.category)}</span>
        <span className="text-gray-300">•</span>
        <span>Stock: {product.inventory?.currentStock ?? 0}</span>
        <span className="text-gray-300">•</span>
        <span>{formatProductPrice(product)}</span>
      </div>
    </div>
  );

  const totalVariance = adjustments.reduce((sum, adj) => sum + adj.variance, 0);
  const totalCostImpact = adjustments.reduce((sum, adj) => sum + (adj.variance * adj.cost), 0);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Stock Adjustment"
      maxWidth="xl"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Adjustment Type and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Adjustment Type
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold text-gray-700 shadow-sm"
              >
                <option value="physical_count">Physical Count</option>
                <option value="damage">Damage</option>
                <option value="theft">Theft</option>
                <option value="transfer">Transfer</option>
                <option value="correction">Correction</option>
                <option value="return">Return</option>
                <option value="write_off">Write Off</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Warehouse Location
              </label>
              <Input
                type="text"
                name="warehouse"
                value={values.warehouse}
                onChange={handleChange}
                onBlur={handleBlur}
                className="rounded-xl py-6 font-bold"
                placeholder="Enter warehouse name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Reason for Adjustment <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="reason"
                value={values.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`rounded-xl py-6 font-bold ${errors.reason ? 'border-red-500' : ''}`}
                placeholder="e.g. Monthly stock take"
              />
              {errors.reason && <p className="text-red-600 text-[10px] font-bold uppercase mt-1.5 px-1">{errors.reason}</p>}
            </div>
          </div>

          {/* Add Products */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <span className="w-1.5 h-4 bg-primary-600 rounded-full mr-2" />
              Manage Inventory Items
            </h3>
            <SearchableDropdown
              placeholder="Search products to adjust..."
              items={products || []}
              onSelect={handleProductSelect}
              onSearch={setProductSearchTerm}
              displayKey={productDisplayKey}
              loading={productsLoading}
              emptyMessage="No products found"
              className="rounded-2xl shadow-md border-gray-200"
            />
          </div>

          {/* Product Adjustment Form */}
          {isAddingProduct && selectedProduct && (
            <div className="bg-primary-50/50 p-6 rounded-2xl border-2 border-dashed border-primary-100 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{selectedProduct.name}</h4>
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Adjusting stock level</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsAddingProduct(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Current Stock
                  </label>
                  <div className="px-4 py-4 bg-white border border-gray-100 rounded-xl font-mono font-bold text-gray-500 text-lg shadow-sm">
                    {selectedProduct.inventory?.currentStock || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    New Stock Count
                  </label>
                  <Input
                    type="number"
                    min="0"
                    className="rounded-xl py-8 font-mono font-bold text-lg text-primary-600 focus:ring-primary-500 shadow-sm border-primary-100"
                    placeholder="Counted qty"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const adjustedStock = parseFloat(e.target.value) || 0;
                        addProductToAdjustment(
                          selectedProduct.inventory?.currentStock || 0,
                          adjustedStock
                        );
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Counted qty"]');
                    addProductToAdjustment(
                      selectedProduct.inventory?.currentStock || 0,
                      parseFloat(input?.value) || 0
                    );
                  }}
                  className="flex-1 py-6 rounded-xl shadow-lg shadow-primary-500/20"
                >
                  Add to Adjustment
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsAddingProduct(false);
                  }}
                  variant="outline"
                  className="px-6 rounded-xl border-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Adjustments List */}
          {adjustments.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900">Adjustment Items ({adjustments.length})</h4>
              <div className="space-y-4">
                {adjustments.map((adjustment) => (
                  <div key={adjustment.product._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{adjustment.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Current: {adjustment.currentStock}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAdjustment(adjustment.product._id)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Adjusted</label>
                        <Input
                          type="number"
                          min="0"
                          value={adjustment.adjustedStock}
                          onChange={(e) => updateAdjustment(adjustment.product._id, 'adjustedStock', parseFloat(e.target.value) || 0)}
                          className="rounded-xl font-mono font-bold"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Variance</label>
                        <div className={`h-10 flex items-center px-4 rounded-xl font-mono font-bold text-sm bg-gray-50 ${adjustment.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adjustment.variance >= 0 ? '+' : ''}{adjustment.variance}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Cost Impact</label>
                        <div className={`h-10 flex items-center px-4 rounded-xl font-mono font-bold text-sm bg-gray-50 ${adjustment.variance * adjustment.cost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          PKR {(adjustment.variance * adjustment.cost).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {adjustments.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                  <p className="text-xl font-bold">{adjustments.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Variance</p>
                  <p className={`text-xl font-bold ${totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalVariance >= 0 ? '+' : ''}{totalVariance}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cost Impact</p>
                  <p className={`text-xl font-bold ${totalCostImpact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    PKR {totalCostImpact.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              className="rounded-2xl p-4 bg-gray-50/50"
              placeholder="Record any specific observations..."
            />
          </div>

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
              isLoading={creating}
              className="px-10 rounded-xl shadow-lg shadow-primary-500/20"
            >
              Submit Adjustment
            </LoadingButton>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default StockAdjustmentModal;
